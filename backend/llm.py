"""
Gemini prompt + response generation using the new google-genai SDK.
"""

import google.genai as genai
from config import settings

# Initialize the Gemini client once
_client = None

def _get_client():
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


SYSTEM_PROMPT = """
You are LexAI, an AI-powered multilingual legal aid assistant for Indian citizens. You help people understand their legal rights in simple, clear language.

CONVERSATION RULES:

1. GREETINGS
- If the user says hello, hi, hey, namaste, or any greeting, respond warmly and simply.
- Example: "Hello! I'm LexAI, your legal aid assistant. What legal question can I help you with today?"
- Do NOT retrieve from knowledge base. Do NOT show sources. Do NOT mention DLSA.

2. CLARIFYING QUESTIONS
- When asking the user for more info (like which state), do NOT show any sources.
- Keep it short and friendly.

3. STATE-SPECIFIC QUESTIONS
- Only ask for the user's state if the query involves state-specific laws like Shops & Establishments Act or state labor rules.
- Central acts like Code on Wages, RTI Act, Consumer Protection Act, IT Act, BNS 2023 apply uniformly across India — do NOT ask for state for these.

4. LEGAL RESPONSES
- Always cite the specific Act and Section in your response like [Code on Wages, 2019, Section 14].
- Keep responses structured but simple — use numbered points for multiple rights.
- Respond in the same language the user is writing in (Hindi, Kannada, Tamil, English, etc.).

5. DLSA MENTION
- Do NOT append DLSA to every response.
- Only mention DLSA when the situation genuinely needs professional legal help or is complex.
- When you do mention it, always explain: "DLSA (District Legal Services Authority) provides free legal aid in your district."

6. TONE
- You are speaking to ordinary Indian citizens, many of whom may not know legal terms.
- Be warm, clear, and empowering — never intimidating or overly formal.
- Never say "I cannot provide legal advice." Instead say "Here is what the law says..." and end with DLSA only when truly needed.

7. RESPONSE DEPTH BY QUESTION TYPE
- Detect the type of user question.
  Type A — Simple Yes/No Questions (e.g., "Can I complain?", "Is this legal?", "Can police arrest me?")
    * Short and direct response, 2–5 lines, maximum 1 citation. Do not give full procedural details unless explicitly asked.
  Type B — Process Questions (e.g., "How do I complain?", "Where to file?", "What documents are needed?")
    * Step‑by‑step explanation with moderate detail.
  Type C — Detailed Explanation Requests (e.g., "Explain more", "Tell me in detail", "Elaborate")
    * Full detailed legal explanation, include sections and multiple citations.
- Ensure the model selects the appropriate style based on the detected question type.
"""


def generate_response(
    query: str,
    chunks: list[dict],
    history: list = None,
    image_base64: str = None,
    image_mime_type: str = None,
    detected_language: str = "en",
) -> str:
    """
    Generate a legal-aid response using Gemini 2.5 Flash.
    Uses retrieved context, optional chat history, detected language, and an optional image.
    """
    client = _get_client()

    # ------------------------------------------------------------------
    # Build context string from retrieved chunks
    # ------------------------------------------------------------------
    context_str = ""
    if chunks:
        for idx, c in enumerate(chunks, start=1):
            context_str += f"\n--- Source {idx} ---\n"
            context_str += f"Act: {c.get('act')}\n"
            context_str += f"Section: {c.get('section')}\n"
            context_str += f"Heading: {c.get('heading')}\n"
            context_str += f"Year: {c.get('year')}\n"
            context_str += f"Content: {c.get('content')}\n"
    else:
        context_str = "No verified legal documents retrieved for this query."

    # ------------------------------------------------------------------
    # Build the full prompt
    # ------------------------------------------------------------------
    prompt = f"System Instructions:\n{SYSTEM_PROMPT}\n"
    prompt += f"detected_language={detected_language}\n\n"

    if history:
        prompt += "Chat History:\n"
        for msg in history:
            role_str = getattr(msg, "role", None) or (
                msg.get("role") if isinstance(msg, dict) else "user"
            )
            content_str_msg = getattr(msg, "content", None) or (
                msg.get("content") if isinstance(msg, dict) else ""
            )
            role = "User" if role_str == "user" else "Assistant"
            prompt += f"{role}: {content_str_msg}\n"
        prompt += "\n"

    prompt += f"Retrieved Context:\n{context_str}\n\n"
    prompt += f"User Query: {query}\n"
    if image_base64:
        prompt += (
            "Note: An image of a document or notice was provided. "
            "Read the image carefully to understand the context.\n"
        )
    prompt += "Answer:"

    # ------------------------------------------------------------------
    # Build contents list (text + optional image)
    # ------------------------------------------------------------------
    contents = [prompt]

    if image_base64 and image_mime_type:
        import base64
        try:
            raw = image_base64.split(",")[1] if "," in image_base64 else image_base64
            image_bytes = base64.b64decode(raw)
            contents.append(
                genai.types.Part.from_bytes(data=image_bytes, mime_type=image_mime_type)
            )
        except Exception as e:
            print(f"[llm] Error decoding image: {e}")

    # ------------------------------------------------------------------
    # Call Gemini 2.5 Flash (gemini-2.5-flash) with retries
    # ------------------------------------------------------------------
    import time
    import logging

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
            )
            return response.text
        except Exception as e:
            if attempt < max_retries:
                backoff = 0.5 * (2 ** attempt)
                logging.warning(f"Gemini generate_content failed (attempt {attempt+1}/{max_retries+1}): {e}. Retrying in {backoff}s.")
                time.sleep(backoff)
            else:
                logging.error(f"Gemini generate_content failed after {max_retries+1} attempts: {e}")
                raise
