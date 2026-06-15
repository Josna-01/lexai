"""
FastAPI app entry point.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ChatRequest, ChatResponse, Citation, SimulationStepRequest, SimulationStepResponse, CustomSituationRequest, CustomScenarioResponse, CustomEvaluationRequest
from retriever import retrieve_documents
from llm import generate_response
from config import settings
from language import detect_language
from query_normalizer import normalize_query
import time
import logging
import json

def call_gemini_model(prompt: str, max_retries: int = 2):
    """Call Gemini model with retries and exponential backoff."""
    for attempt in range(max_retries + 1):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if attempt < max_retries:
                backoff = 0.5 * (2 ** attempt)
                logging.warning(f"Gemini call failed (attempt {attempt+1}/{max_retries+1}): {e}. Retrying in {backoff}s.")
                time.sleep(backoff)
            else:
                logging.error(f"Gemini call failed after {max_retries+1} attempts: {e}")
                raise

def safe_parse_model_response(response_text: str, default: dict):
    """Clean markdown fences and parse JSON, fallback to default on error."""
    try:
        txt = response_text
        if txt.startswith("```"):
            lines = txt.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            txt = "\n".join(lines).strip()
        return json.loads(txt)
    except Exception as e:
        logging.error(f"Failed to parse model response: {e}. Using default.")
        return default

app = FastAPI(
    title="LexAI API",
    description="Backend API for Legal Aid Intelligence Agent",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "retriever_type": settings.RETRIEVER_TYPE,
        "environment": settings.ENVIRONMENT
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint that retrieves documents and generates a grounded response.
    """
    try:
        # 1. Detect language
        language = detect_language(request.query)

        # 2. Normalize query
        normalized = normalize_query(request.query)

        # 3. Retrieve relevant legal document chunks using the normalized query
        chunks = retrieve_documents(
            query=normalized, 
            match_count=settings.MAX_RETRIEVED_CHUNKS
        )
        
        # 4. Generate LLM response grounded in the retrieved chunks
        try:
            answer = generate_response(
                query=request.query, 
                chunks=chunks, 
                history=request.history,
                image_base64=request.image_base64,
                image_mime_type=request.image_mime_type,
                detected_language=language
            )
        except Exception as e:
            logging.error(f"LLM generation failed in chat: {e}. Falling back to retrieved chunks summary.")
            if language == "hi":
                answer = "नमस्ते! मैं अभी अपने AI सर्वर से नहीं जुड़ पा रहा हूँ। आपके प्रश्न से संबंधित कुछ मुख्य कानून नीचे दिए गए हैं:\n\n"
            elif language == "kn":
                answer = "ನಮಸ್ಕಾರ! ನನ್ನ AI ಸರ್ವರ್‌ನೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ನನಗೆ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಕೆಲವು ಪ್ರಮುಖ ಕಾನೂನುಗಳು ಈ ಕೆಳಗಿನಂತಿವೆ:\n\n"
            else:
                answer = "Hello! I am currently unable to reach my AI processor. Here are the relevant legal provisions retrieved for your query:\n\n"
            
            for idx, c in enumerate(chunks, start=1):
                section_val = c.get('section', '')
                if section_val:
                    if str(section_val).strip().lower().startswith("section"):
                        sec_str = f" - {section_val}"
                    else:
                        sec_str = f" - Section {section_val}"
                else:
                    sec_str = ""
                answer += f"{idx}. **{c.get('act')}**{sec_str}: {c.get('content')[:200]}...\n\n"

        
        # 5. Extract unique citations from retrieved chunks
        citations = []
        seen = set()
        for c in chunks:
            citation_key = (c.get("act"), c.get("section"))
            if citation_key not in seen:
                seen.add(citation_key)
                citations.append(
                    Citation(
                        act=c.get("act"),
                        section=c.get("section"),
                        heading=c.get("heading"),
                        year=c.get("year")
                    )
                )
                
        return ChatResponse(answer=answer, citations=citations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/simulation/scenarios")
def get_scenarios():
    """
    Returns a list of available simulation scenarios with metadata.
    """
    from scenarios import SCENARIOS
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "act": s["act"],
            "character": s["character"],
            "description": s["description"],
            "icon": s["icon"],
            "start_node": s["start_node"]
        }
        for s in SCENARIOS.values()
    ]


@app.post("/api/simulation/step", response_model=SimulationStepResponse)
async def simulation_step(request: SimulationStepRequest):
    """
    Processes a step in the simulation, retrieves relevant legal documents,
    evaluates the choice using Gemini, and returns the results.
    """
    from scenarios import SCENARIOS
    import google.generativeai as genai
    import json

    # 1. Validate scenario
    scenario = SCENARIOS.get(request.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # 2. Validate node
    node = scenario["nodes"].get(request.current_node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # 3. Validate choice
    choice_id = request.user_choice.upper()
    choice = node["choices"].get(choice_id)
    if not choice:
        raise HTTPException(status_code=400, detail=f"Choice '{choice_id}' not found in node '{request.current_node_id}'")

    # Default fallback values in case of API failure
    score_delta = choice["score_delta"]
    
    # Infer grade from score delta if fallback is needed
    if score_delta >= 15:
        default_grade = "correct"
    elif score_delta <= -15:
        default_grade = "illegal"
    else:
        default_grade = "risky"

    fallback_explanation = choice["fallback_explanation"]
    fallback_citation = choice["fallback_citation"]
    next_node = choice["next_node"]

    # 4. RAG Retrieval for the specific choice
    retrieval_query = f"{scenario['act']} {choice['fallback_citation']} {choice['text']}"
    chunks = retrieve_documents(query=retrieval_query, match_count=3)

    # 5. Call Gemini to evaluate the choice dynamically
    explanation = fallback_explanation
    citation = fallback_citation
    grade = default_grade

    if settings.GEMINI_API_KEY:
        try:
            pass

            context_str = ""
            for idx, c in enumerate(chunks, start=1):
                context_str += f"\n--- Source {idx} ---\n"
                context_str += f"Act: {c.get('act')}\n"
                context_str += f"Section: {c.get('section')}\n"
                context_str += f"Content: {c.get('content')}\n"

            if not context_str:
                context_str = f"Act: {scenario['act']}\nCitation: {choice['fallback_citation']}\nContent: {choice['fallback_explanation']}"

            prompt = f"""
You are an expert Indian Legal Aid evaluator grading a choice in a Choose-Your-Own-Adventure game.
Scenario: {scenario['title']}
Act involved: {scenario['act']}
Current situation: {node['story']}
User's choice: {choice['text']}

Retrieved legal chunks:
{context_str}

Please evaluate the user's choice and return a JSON object with:
1. "grade": must be exactly one of "correct", "risky", or "illegal".
   - "correct": the action is legally protected, direct, and recommended.
   - "risky": the action has no legal standing, is ineffective, or is a delay.
   - "illegal": the action violates Indian laws, exposes the user to criminal/civil liability, or is highly detrimental.
2. "explanation": a 2-3 sentence clear, encouraging explanation in simple terms of the legal consequences of this choice under Indian law.
3. "citation": the exact act section number cited (e.g. "Section 15, Payment of Wages Act, 1936").

Format your response as a valid JSON object ONLY. Do not include markdown formatting or code block markers.
"""
            response_text = call_gemini_model(prompt)
            eval_data = safe_parse_model_response(response_text, {
                "grade": default_grade,
                "explanation": fallback_explanation,
                "citation": fallback_citation
            })
            
            # Extract and validate fields
            if eval_data.get("grade") in ["correct", "risky", "illegal"]:
                grade = eval_data["grade"]
            explanation = eval_data.get("explanation", fallback_explanation)
            citation = eval_data.get("citation", fallback_citation)
            print(f"Gemini graded choice: {grade} - {citation}")

        except Exception as e:
            print(f"Failed to dynamically grade choice via Gemini: {e}. Using hardcoded fallback.")

    return SimulationStepResponse(
        grade=grade,
        explanation=explanation,
        citation=citation,
        score_delta=score_delta,
        next_node=next_node
    )


@app.post("/api/simulation/generate", response_model=CustomScenarioResponse)
async def generate_custom_scenario(request: CustomSituationRequest):
    """
    Dynamically generates a custom simulation scenario and 4 choices
    grounded in relevant laws.
    """
    import google.generativeai as genai
    import json

    # 1. RAG retrieval using the user's custom situation
    chunks = retrieve_documents(query=request.situation, match_count=3)
    context_str = ""
    for idx, c in enumerate(chunks, start=1):
        context_str += f"\n--- Source {idx} ---\n"
        context_str += f"Act: {c.get('act')}\n"
        context_str += f"Section: {c.get('section')}\n"
        context_str += f"Content: {c.get('content')}\n"

    # Default fallbacks
    default_response = CustomScenarioResponse(
        title="Your Legal Rights",
        character="Citizen",
        nodes={
            "1": {
                "story": f"You are dealing with the following situation: {request.situation}. How do you start?",
                "choices": {
                    "A": "Gather all physical evidence and document the incident timeline.",
                    "B": "Send a formal written complaint to the counterparty requesting resolution.",
                    "C": "Go to social media to publicly air the issue.",
                    "D": "Seek immediate advice from a local legal aid office."
                }
            },
            "2": {
                "story": "The counterparty refuses to respond to your initial attempts. They threaten to terminate your contract/services if you persist.",
                "choices": {
                    "A": "Refuse their threats and document the communication.",
                    "B": "Give in to their demands to avoid trouble.",
                    "C": "Argue with their staff in person.",
                    "D": "Seek local mediation or legal counseling."
                }
            },
            "3": {
                "story": "The dispute escalates. A third party offers to settle the matter for a small fraction of what you are rightfully owed, demanding a full release waiver.",
                "choices": {
                    "A": "Reject the unfair offer and insist on full legal redressal.",
                    "B": "Accept the low settlement to put an end to the stress.",
                    "C": "Attempt to compromise with them for a slightly higher figure.",
                    "D": "Hire a private local coordinator to threaten them back."
                }
            },
            "4": {
                "story": "You decide to proceed with a formal dispute. You must choose the correct legal forum or authority to submit your application.",
                "choices": {
                    "A": "File the claim in the appropriate district tribunal or commissioner office.",
                    "B": "Submit a petition directly to the Supreme Court.",
                    "C": "Send a private legal notice through registered post.",
                    "D": "Apply to the District Legal Services Authority (DLSA) for a free panel advocate."
                }
            },
            "5": {
                "story": "Resolution. The authority rules in your favor, ordering a full remedy and compensation. However, the other party delays executing the order.",
                "choices": {
                    "A": "File an execution application in court to enforce compliance.",
                    "B": "Publicly defame them to force payment.",
                    "C": "File a completely new complaint to start over.",
                    "D": "Wait patiently for them to pay you."
                }
            }
        }
    )

    if not settings.GEMINI_API_KEY:
        return default_response

    try:

        prompt = f"""
You are an expert Indian Legal Aid educator designing an interactive Choose-Your-Own-Adventure scenario to teach a citizen about their rights.
The user described their situation as: "{request.situation}"

Here are retrieved legal acts/sections related to their situation:
{context_str}

Please generate an interactive legal decision-making scenario with 5 connected situations representing the journey:
- Situation 1: Discovery (setting the scene of the problem)
- Situation 2: Complication (a hurdle or threat when trying to resolve it)
- Situation 3: Escalation (an unfair settlement offer or secondary complication)
- Situation 4: Legal Action (submitting the case to a formal legal forum or getting legal aid)
- Situation 5: Resolution (enforcing the order or handling non-compliance)

Each of the 5 situations ("nodes") must have:
- A story (3-4 sentences narrative) setting up that specific stage.
- A set of exactly four choices ("A", "B", "C", "D") representing actions:
  - One choice must be the legally correct/recommended path (e.g. filing a complaint under the proper act).
  - One choice should be a common "risky" or "ineffective" path (e.g. waiting, verbal argument, cc'ing everyone on emails).
  - One choice must be "illegal" or "harmful" under Indian Law (e.g. defamation, threats, physical force, trespassing).
  - One choice should be another neutral or risky path.

Format your response as a valid JSON object ONLY matching this schema:
{{
  "title": "scenario title",
  "character": "character name and role in India (e.g. Ramesh, a tenant in Mumbai)",
  "nodes": {{
    "1": {{
      "story": "story of Situation 1",
      "choices": {{
        "A": "text of choice A",
        "B": "text of choice B",
        "C": "text of choice C",
        "D": "text of choice D"
      }}
    }},
    "2": {{
      "story": "story of Situation 2",
      "choices": {{
        "A": "text of choice A",
        "B": "text of choice B",
        "C": "text of choice C",
        "D": "text of choice D"
      }}
    }},
    "3": {{
      "story": "story of Situation 3",
      "choices": {{
        "A": "text of choice A",
        "B": "text of choice B",
        "C": "text of choice C",
        "D": "text of choice D"
      }}
    }},
    "4": {{
      "story": "story of Situation 4",
      "choices": {{
        "A": "text of choice A",
        "B": "text of choice B",
        "C": "text of choice C",
        "D": "text of choice D"
      }}
    }},
    "5": {{
      "story": "story of Situation 5",
      "choices": {{
        "A": "text of choice A",
        "B": "text of choice B",
        "C": "text of choice C",
        "D": "text of choice D"
      }}
    }}
  }}
}}
Do not include markdown code block markers or formatting. Return raw JSON string only.
"""
        response_text = call_gemini_model(prompt)
        data = safe_parse_model_response(response_text, {
            "title": default_response.title,
            "character": default_response.character,
            "nodes": default_response.nodes
        })
        return CustomScenarioResponse(
            title=data.get("title", default_response.title),
            character=data.get("character", default_response.character),
            nodes=data.get("nodes", default_response.nodes)
        )
    except Exception as e:
        print(f"Error generating custom scenario: {e}")
        return default_response


@app.post("/api/simulation/evaluate", response_model=SimulationStepResponse)
async def evaluate_custom_choice(request: CustomEvaluationRequest):
    """
    Grades the user's choice in a dynamically generated custom scenario,
    explaining the legal grounds and citing the law.
    """
    import google.generativeai as genai
    import json

    # 1. RAG retrieval using situation + selected choice text
    retrieval_query = f"{request.situation} {request.choice_text}"
    chunks = retrieve_documents(query=retrieval_query, match_count=3)
    context_str = ""
    for idx, c in enumerate(chunks, start=1):
        context_str += f"\n--- Source {idx} ---\n"
        context_str += f"Act: {c.get('act')}\n"
        context_str += f"Section: {c.get('section')}\n"
        context_str += f"Content: {c.get('content')}\n"

    # Default fallback values
    grade = "risky"
    explanation = "Your choice might have unexpected consequences. It is best to seek formal legal counsel."
    citation = "Indian Legislation"
    score_delta = 0

    if not settings.GEMINI_API_KEY:
        return SimulationStepResponse(
            grade=grade,
            explanation=explanation,
            citation=citation,
            score_delta=score_delta,
            next_node="end"
        )

    try:
        pass

        prompt = f"""
You are an expert Indian Legal Aid evaluator grading a choice in a custom scenario.
Situation: "{request.situation}"
Story setting: "{request.story}"
Selected choice: "{request.choice_text}" (Choice Key: {request.choice_key})

Here are retrieved legal acts/sections related to this context:
{context_str}

Please evaluate the chosen action and return a JSON object with:
1. "grade": must be exactly one of "correct", "risky", or "illegal".
   - "correct": the action is legally protected, direct, and recommended.
   - "risky": the action has no legal standing, is ineffective, or is a delay.
   - "illegal": the action violates Indian laws, exposes the user to criminal/civil liability, or is highly detrimental.
2. "explanation": a 2-3 sentence clear, encouraging explanation in simple terms of the legal consequences of this choice under Indian law.
3. "citation": the exact act section number cited (e.g. "Section 12, Consumer Protection Act, 2019").

Format your response as a valid JSON object ONLY. Do not include markdown formatting or code block markers.
"""
        response_text = call_gemini_model(prompt)
        eval_data = safe_parse_model_response(response_text, {
            "grade": grade,
            "explanation": explanation,
            "citation": citation
        })
        grade = eval_data.get("grade", grade)
        explanation = eval_data.get("explanation", explanation)
        citation = eval_data.get("citation", citation)

        if grade == "correct":
            score_delta = 20
        elif grade == "illegal":
            score_delta = -10
        else:
            score_delta = 0

    except Exception as e:
        print(f"Error evaluating custom choice: {e}")

    return SimulationStepResponse(
        grade=grade,
        explanation=explanation,
        citation=citation,
        score_delta=score_delta,
        next_node="end"
    )


@app.get("/api/simulation/categories")
def get_simulation_categories():
    """
    Returns the list of available categories for the simulator.
    """
    from simulator_scenarios import CATEGORY_SCENARIOS
    return list(CATEGORY_SCENARIOS.keys())


@app.get("/api/simulation/category-scenario")
def get_category_scenario(category: str):
    """
    Returns a random scenario from the pool for the chosen category.
    """
    from simulator_scenarios import get_random_scenario
    try:
        sc = get_random_scenario(category)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found")

    return {
        "id": f"category_{category.lower().replace(' ', '_')}",
        "title": sc["title"],
        "act": sc.get("act", "Indian Legislation"),
        "character": sc.get("character", "Citizen"),
        "isCategory": True,
        "nodes": sc.get("nodes", {})
    }


