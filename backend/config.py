"""
Environment variables and application configuration using Pydantic Settings.
"""

from typing import Optional
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App General Settings
    ENVIRONMENT: str = "development"
    MAX_RETRIEVED_CHUNKS: int = 5
    
    # Active Retriever Toggle: "supabase" (pgvector) or "foundry" (Microsoft Foundry IQ)
    RETRIEVER_TYPE: str = "supabase"
    
    # Supabase (Local/pgvector Setup)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # Gemini API (Intelligence Layer)
    GEMINI_API_KEY: str = ""
    
    # Microsoft Foundry IQ & Azure AI Search Configuration
    AZURE_AI_PROJECT_CONNECTION_STRING: Optional[str] = None
    AZURE_AI_SEARCH_ENDPOINT: Optional[str] = None
    AZURE_AI_SEARCH_KEY: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    FOUNDRY_IQ_INDEX_NAME: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
