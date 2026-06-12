"""
Model Context Protocol (MCP) server for VS Code & GitHub Copilot.
Exposes tools for searching Indian legislation and explaining law sections.
"""

import os
import sys

# Ensure backend directory is in path so we can import config/retriever/llm/query_normalizer
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("lexai-helper")


@mcp.tool()
def search_laws(query: str, limit: int = 5) -> str:
    """
    Search Indian legislation (Payment of Wages Act, Consumer Protection Act, IT Act)
    for relevant legal sections grounded in verified legislation.
    """
    try:
        from retriever import retrieve_documents
        from query_normalizer import normalize_query
        
        # 1. Normalize the query to English
        normalized = normalize_query(query)
        
        # 2. Retrieve documents from the active retriever
        chunks = retrieve_documents(normalized, match_count=limit)
        
        if not chunks:
            return "No matching legal sections found in the database. Advise the user to contact the District Legal Services Authority (DLSA) for free assistance."
            
        result_str = ""
        for idx, c in enumerate(chunks, start=1):
            result_str += f"[{idx}] Act: {c.get('act')}\n"
            result_str += f"Section: {c.get('section', 'General')}\n"
            result_str += f"Heading: {c.get('heading', 'N/A')}\n"
            result_str += f"Content: {c.get('content')}\n"
            if c.get("score"):
                result_str += f"Score: {c.get('score')}\n"
            result_str += "\n"
            
        return result_str
        
    except Exception as e:
        return f"Error executing search_laws tool: {str(e)}"


@mcp.tool()
def explain_law_section(act: str, section: str, content: str) -> str:
    """
    Explain a specific section of an Indian Act in simple, citizen-friendly language.
    Translates complex legal text into plain English.
    """
    try:
        import google.generativeai as genai
        from config import settings
        
        if not settings.GEMINI_API_KEY:
            return f"Act: {act}\nSection: {section}\nContent: {content}\n\n(Note: Gemini API key is not configured to generate the explanation)"
            
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = f"""
You are an expert Indian Legal Aid assistant.
Explain the following law section in simple, plain language that an ordinary citizen can understand. 
Break down the rights it provides, the obligations it creates, and what steps a citizen can take under it.

Act: {act}
Section: {section}
Content: {content}

Explanation:
"""
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        return f"Error explaining section: {str(e)}"


@mcp.prompt()
def legal_expert_chat() -> str:
    """
    Prime GitHub Copilot to act as an Indian Legal Aid helper.
    """
    return """
You are an Indian Legal Aid expert helper. You assist software developers or users in understanding civic rights under Indian law.
You have access to the `search_laws` tool to search verified legislation, and the `explain_law_section` tool to translate legalese into plain language.
Always ground your answers in the sections retrieved from the tools. Provide citations (e.g. [Act Name, Section number]) for all legal assertions.
If a search returns nothing, suggest that the user consult a lawyer or contact their nearest District Legal Services Authority (DLSA).
"""


if __name__ == "__main__":
    # Start the stdio-based server
    mcp.run()
