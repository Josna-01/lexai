"""
FastAPI app entry point.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ChatRequest, ChatResponse, Citation
from retriever import retrieve_documents
from llm import generate_response
from config import settings
from language import detect_language
from query_normalizer import normalize_query

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
        answer = generate_response(
            query=request.query, 
            chunks=chunks, 
            history=request.history,
            image_base64=request.image_base64,
            image_mime_type=request.image_mime_type,
            detected_language=language
        )

        
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
            # Configure genai (redundant but safe)
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash")

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
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up markdown code blocks if any
            if response_text.startswith("```"):
                # Strip the first line (e.g. ```json) and the last line (```)
                lines = response_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                response_text = "\n".join(lines).strip()

            eval_data = json.loads(response_text)
            
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


