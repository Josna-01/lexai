"""
Query normalizer that converts multilingual user input (Hindi/Kannada/Hinglish/Kanglish)
into clean English legal queries for RAG retrieval.
"""

import google.generativeai as genai
from config import settings


def normalize_query(user_message: str) -> str:
    """
    Normalizes messy multilingual input into a clean English legal query for RAG retrieval.
    """
    if not user_message or not user_message.strip():
        return ""

    if not settings.GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set. Skipping query normalization.")
        return user_message

    try:
        # Configure genai (redundant but safe)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        model = genai.GenerativeModel("gemini-3.5-flash")
        
        system_instruction = """
You are a legal query normalizer for Indian users.

Input may contain:
- English
- Hindi
- Kannada
- Hinglish
- Kanglish
- slang
- spelling mistakes
- broken grammar

Convert the input into a concise English legal retrieval query. 
For example:
- "mujhe salary nahi mila 3 months se" -> "Employer has not paid salary for 3 months"
- "salary siglilla" -> "Salary not received"
- "refund kodta illa" -> "Seller refused refund"

Return ONLY the normalized query text, with no markdown code blocks, quotes, prefix labels or extra explanations.
"""
        response = model.generate_content([system_instruction, f"Input: {user_message}"])
        normalized = response.text.strip()
        
        # Clean up any potential markdown formatting
        if normalized.startswith("```"):
            lines = normalized.split("\n")
            if len(lines) >= 3:
                normalized = lines[1]
            else:
                normalized = normalized.replace("```", "")
        
        normalized = normalized.strip().strip('"').strip("'")
        print(f"Normalized query: '{user_message}' -> '{normalized}'")
        return normalized

    except Exception as e:
        print(f"Error during query normalization: {e}. Using original message.")
        return user_message
