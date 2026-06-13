"""
Supabase pgvector retrieval logic using native RPC similarity search.
"""

import google.generativeai as genai
from supabase import create_client, Client
from config import settings


class PGVectorRetriever:
    """
    Retriever class that connects to Supabase and queries the legal_chunks table
    using cosine similarity search (via pgvector).
    """
    def __init__(self):
        # Configure Gemini
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Configure Supabase
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            self.supabase: Client = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_SERVICE_KEY
            )
        else:
            self.supabase = None

    def retrieve(self, query: str, match_count: int = 5) -> list[dict]:
        """
        Query Supabase database for chunks similar to the query.
        """
        if not self.supabase:
            print("Warning: Supabase client is not initialized.")
            return []
            
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=query,
                task_type="retrieval_query",
                output_dimensionality=768
            )
            query_embedding = result["embedding"]

            
            # 2. Call the match_documents RPC in Supabase
            response = self.supabase.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": match_count
                }
            ).execute()
            
            return response.data or []
            
        except Exception as e:
            print(f"Error executing similarity search: {e}")
            return []
