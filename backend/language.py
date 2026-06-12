"""
Language detection service using Azure AI Language Service (Text Analytics SDK).
"""

import os
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from config import settings


def get_language_client():
    endpoint = settings.AZURE_LANGUAGE_ENDPOINT or os.getenv("AZURE_LANGUAGE_ENDPOINT")
    key = settings.AZURE_LANGUAGE_KEY or os.getenv("AZURE_LANGUAGE_KEY")
    
    if endpoint and key:
        try:
            return TextAnalyticsClient(
                endpoint=endpoint,
                credential=AzureKeyCredential(key)
            )
        except Exception as e:
            print(f"Error initializing Azure Language Client: {e}")
            return None
    return None


def detect_language(text: str) -> str:
    """
    Returns language code: 'hi' (Hindi), 'kn' (Kannada), 'en' (English), etc.
    Falls back to 'en' if detection fails or credentials are missing.
    """
    if not text or not text.strip():
        return "en"
        
    client = get_language_client()
    if not client:
        # If client not initialized, fallback to 'en' (or simple heuristics if needed)
        # Check for Kannada characters
        if any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in text):
            return "kn"
        # Check for Hindi/Devanagari characters
        if any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in text):
            return "hi"
        return "en"

    try:
        result = client.detect_language(
            documents=[{"id": "1", "text": text}]
        )
        if result and len(result) > 0 and not result[0].is_error:
            lang_code = result[0].primary_language.iso6391_name
            # Return standard ISO 639-1 language code (we care about 'hi', 'kn', 'en')
            return lang_code
        return "en"
    except Exception as e:
        print(f"Azure language detection failed: {e}. Falling back to 'en'.")
        # Direct fallback heuristic on failure
        if any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in text):
            return "kn"
        if any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in text):
            return "hi"
        return "en"
