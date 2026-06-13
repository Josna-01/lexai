"""
Microsoft Foundry IQ / Azure AI Search retrieval using HYBRID search:
  - Integrated vector search (Azure auto-embeds query via text-embedding-3-small)
  - BM25 keyword search
  - Reciprocal Rank Fusion (RRF) to combine both signals

This gives accurate semantic results — e.g. "salary not received" correctly
retrieves Payment of Wages Act chunks rather than irrelevant acts.
"""

import os
import re
from urllib.parse import unquote

from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizableTextQuery
from azure.core.credentials import AzureKeyCredential
from config import settings


class FoundryRetriever:
    """
    Retriever that uses Azure AI Search hybrid search (vector + keyword RRF).
    The index has a built-in vectorizer (text-embedding-3-small via Azure OpenAI)
    so we can pass raw text and Azure handles the embedding automatically.
    """

    def __init__(self):
        endpoint = (
            settings.AZURE_SEARCH_ENDPOINT
            or settings.AZURE_AI_SEARCH_ENDPOINT
            or os.getenv("AZURE_SEARCH_ENDPOINT")
            or os.getenv("AZURE_AI_SEARCH_ENDPOINT")
        )
        key = (
            settings.AZURE_SEARCH_KEY
            or settings.AZURE_AI_SEARCH_KEY
            or os.getenv("AZURE_SEARCH_KEY")
            or os.getenv("AZURE_AI_SEARCH_KEY")
        )
        index_name = (
            settings.AZURE_SEARCH_INDEX
            or settings.FOUNDRY_IQ_INDEX_NAME
            or os.getenv("AZURE_SEARCH_INDEX")
            or os.getenv("FOUNDRY_IQ_INDEX_NAME")
        )

        self.client = None
        if endpoint and key and index_name:
            try:
                self.client = SearchClient(
                    endpoint=endpoint,
                    index_name=index_name,
                    credential=AzureKeyCredential(key),
                )
                print(f"[FoundryRetriever] Initialized Azure AI Search — index: '{index_name}'")
            except Exception as e:
                print(f"[FoundryRetriever] Init error: {e}")
        else:
            print("[FoundryRetriever] Warning: Azure AI Search credentials not fully set.")

    # ------------------------------------------------------------------
    def retrieve(self, query: str, match_count: int = 5) -> list[dict]:
        """
        Hybrid search: integrated vector (auto-embedded by Azure) + BM25,
        fused via Reciprocal Rank Fusion. Falls back to keyword-only if the
        vectorizer is unavailable.
        """
        if not self.client:
            print("[FoundryRetriever] Client not initialized — returning [].")
            return []

        try:
            results = self._hybrid_search(query, match_count)
        except Exception as e:
            print(f"[FoundryRetriever] Hybrid search failed ({e}), falling back to keyword search.")
            try:
                results = self._keyword_search(query, match_count)
            except Exception as e2:
                print(f"[FoundryRetriever] Keyword search also failed: {e2}")
                return []

        return self._parse_results(results, match_count)

    # ------------------------------------------------------------------
    def _hybrid_search(self, query: str, top: int):
        """Hybrid search: BM25 keyword + integrated vector via Azure vectorizer."""
        vector_query = VectorizableTextQuery(
            text=query,
            k_nearest_neighbors=top * 3,   # over-fetch, then RRF picks best
            fields="snippet_vector",
        )
        return self.client.search(
            search_text=query,              # BM25 component
            vector_queries=[vector_query],  # vector component
            top=top,
            select=["snippet", "metadata_storage_path", "uid"],
        )

    def _keyword_search(self, query: str, top: int):
        """Fallback: pure BM25 keyword search."""
        return self.client.search(
            search_text=query,
            top=top,
            select=["snippet", "metadata_storage_path", "uid"],
        )

    # ------------------------------------------------------------------
    def _parse_results(self, results, match_count: int) -> list[dict]:
        chunks = []
        for result in results:
            snippet = result.get("snippet", "")
            path = result.get("metadata_storage_path", "")

            # Extract human-readable act name from filename
            act = "Indian Legislation"
            year = ""
            if path:
                filename = os.path.basename(path)
                act_name = os.path.splitext(unquote(filename))[0]
                act = act_name.replace("_", " ").replace("-", " ").strip()
                year_match = re.search(r"\b(19\d{2}|20\d{2})\b", act)
                year = year_match.group(1) if year_match else ""

            # Try to pull a section number and heading from the snippet text
            section = ""
            heading = ""
            sec_heading = re.search(
                r"(?:^|\n|\r)\s*(\d+)\.\s+([^.\n\r\t]{3,80})", snippet
            )
            if sec_heading:
                section = f"Section {sec_heading.group(1)}"
                heading = sec_heading.group(2).strip()
            else:
                sec_only = re.search(r"[sS]ection\s+(\d+)", snippet)
                if sec_only:
                    section = f"Section {sec_only.group(1)}"

            chunks.append(
                {
                    "content": snippet,
                    "source": path or "unknown",
                    "score": result.get("@search.score", 0.0),
                    "similarity": result.get("@search.score", 0.0),
                    "section": section,
                    "act": act,
                    "year": year,
                    "heading": heading,
                }
            )

        return chunks[:match_count]
