"""
Microsoft Foundry IQ / Azure AI Search direct retrieval logic using azure-search-documents.
"""

import os
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from config import settings


class FoundryRetriever:
    """
    Retriever class that connects directly to Azure AI Search
    and queries the legal legislation index.
    """
    def __init__(self):
        endpoint = settings.AZURE_SEARCH_ENDPOINT or os.getenv("AZURE_SEARCH_ENDPOINT")
        key = settings.AZURE_SEARCH_KEY or os.getenv("AZURE_SEARCH_KEY")
        index_name = settings.AZURE_SEARCH_INDEX or os.getenv("AZURE_SEARCH_INDEX") or settings.FOUNDRY_IQ_INDEX_NAME

        if endpoint and key and index_name:
            try:
                self.client = SearchClient(
                    endpoint=endpoint,
                    index_name=index_name,
                    credential=AzureKeyCredential(key)
                )
                print(f"Initialized Azure AI Search client for index '{index_name}'")
            except Exception as e:
                print(f"Error initializing Azure AI Search client: {e}")
                self.client = None
        else:
            print("Warning: Azure AI Search credentials not fully configured in environment.")
            self.client = None

    def retrieve(self, query: str, match_count: int = 5) -> list[dict]:
        """
        Query Azure AI Search for relevant chunks.
        """
        if not self.client:
            print("Warning: Azure Search client is not initialized. Returning empty results.")
            return []

        try:
            results = self.client.search(
                search_text=query,
                top=match_count,
                include_total_count=True
            )

            chunks = []
            for result in results:
                chunks.append({
                    "content": result.get("content", ""),
                    "source": result.get("source", "unknown"),
                    "score": result.get("@search.score", 0.0),
                    "similarity": result.get("@search.score", 0.0),
                    "section": result.get("section", ""),
                    "act": result.get("act", "")
                })

            # Return top 3 chunks (or up to match_count, but capped at 3 for prompt brevity as per doc spec)
            return chunks[:3]

        except Exception as e:
            print(f"Error querying Azure AI Search: {e}")
            return []
