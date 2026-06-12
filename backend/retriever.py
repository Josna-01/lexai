"""
Main retriever selector routing to the active retrieval engine.
"""

from config import settings


def get_retriever():
    """
    Returns the active retriever instance based on the RETRIEVER_TYPE setting.
    """
    if settings.RETRIEVER_TYPE == "foundry":
        from foundry_retriever import FoundryRetriever
        return FoundryRetriever()
    else:
        from pgvector_retriever import PGVectorRetriever
        return PGVectorRetriever()


def retrieve_documents(query: str, match_count: int = 5) -> list[dict]:
    """
    Retrieve documents relevant to the query from the active retrieval engine.
    If 'foundry' is primary, but fails or returns empty, falls back to 'supabase' pgvector.
    """
    chunks = []
    
    # Try Foundry IQ first
    try:
        from foundry_retriever import FoundryRetriever
        retriever = FoundryRetriever()
        chunks = retriever.retrieve(query, match_count=match_count)
    except Exception as e:
        print(f"Foundry retrieval failed: {e}")

    # Fall back to Supabase pgvector if no chunks retrieved
    if not chunks:
        try:
            from pgvector_retriever import PGVectorRetriever
            retriever = PGVectorRetriever()
            chunks = retriever.retrieve(query, match_count=match_count)
            if chunks:
                print("Using Supabase pgvector fallback search")
        except Exception as e:
            print(f"Supabase pgvector retrieval fallback failed: {e}")
            
    return chunks

