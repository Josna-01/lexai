"""
Main retriever selector routing to the active retrieval engine.
"""

from .config import settings


def get_retriever():
    """
    Returns the active retriever instance based on the RETRIEVER_TYPE setting.
    """
    if settings.RETRIEVER_TYPE == "foundry":
        from .foundry_retriever import FoundryRetriever
        return FoundryRetriever()
    else:
        from .pgvector_retriever import PGVectorRetriever
        return PGVectorRetriever()


def retrieve_documents(query: str, match_count: int = 5) -> list[dict]:
    """
    Retrieve documents relevant to the query from the active retrieval engine.
    """
    retriever = get_retriever()
    return retriever.retrieve(query, match_count=match_count)
