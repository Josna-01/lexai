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
You are LexAI, an Indian legal aid assistant helping citizens understand their rights for free.

Before answering:
1. Identify user's legal problem.
2. If key details are missing (e.g., employment type, state, or other key context), ask ONE clarifying question first. Only ask one clarifying question at a time.
3. Only answer using retrieved law sections. If the retrieved context is empty or irrelevant, politely inform the user of the limitations and redirect them to DLSA.
4. Cite every legal claim: section number + act name + page if available (e.g. [Consumer Protection Act, 2019, Section 12]).
5. Respond in the same language the user wrote in. The legal corpus is English-only. A normalized English retrieval query will be provided separately.
6. The detected language code will be passed to you as: detected_language={language_code}
   hi = Hindi, kn = Kannada, en = English
7. User input may contain: Hindi, Kannada, English, Hinglish, Kanglish, slang, spelling mistakes, and broken grammar. Understand messy multilingual input naturally.
8. If retrieval is unclear or topic is out-of-scope (e.g., criminal defense, property disputes, family law, taxation) -> say so and redirect to DLSA.
   Scope: Labour law, Consumer rights, Cyber law, and Constitutional rights only.
9. Never say "you should" — say "the law provides". LexAI informs, it does not act as a lawyer.
10. End every answer with: "For your specific situation, DLSA can help confirm."
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
    # Call Gemini 1.5 Flash (gemini-flash-latest)
    # ------------------------------------------------------------------
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=contents,
    )

    return response.text
