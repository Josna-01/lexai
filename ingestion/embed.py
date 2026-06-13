"""
Embedding generation and Supabase pgvector upload logic.
"""

import os
import time
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    supabase = None

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def generate_embedding(text: str) -> list[float]:
    """
    Generate 768-dimensional embedding for the input text using Gemini's gemini-embedding-001 model.
    Includes rate-limit retry logic with exponential backoff (handles HTTP 429).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in the environment.")
        
    max_retries = 5
    delay = 2.0  # Initial delay in seconds
    
    for attempt in range(max_retries):
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            return result["embedding"]
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower() or "limit" in str(e).lower():
                print(f"Rate limit hit. Retrying in {delay}s (Attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                delay *= 2.0  # Exponential backoff
            else:
                raise e
                
    raise RuntimeError("Failed to generate embedding after maximum retries due to rate limits.")




def upload_chunks(chunks: list[dict]) -> None:
    """
    Generate embeddings for a list of document chunks and upload them to Supabase.
    
    Each chunk dict should have: 'act', 'section', 'heading', 'year', 'content'.
    """
    if not supabase:
        raise ValueError("Supabase URL or Service Key is not set in the environment.")

    print(f"Starting embedding and upload for {len(chunks)} chunks...")
    
    for idx, chunk in enumerate(chunks, start=1):
        try:
            # Generate embedding
            embedding = generate_embedding(chunk["content"])
            
            # Prepare database row
            row = {
                "act": chunk["act"],
                "section": chunk["section"],
                "heading": chunk["heading"],
                "year": chunk["year"],
                "content": chunk["content"],
                "embedding": embedding
            }
            
            # Insert to Supabase table
            supabase.table("legal_chunks").insert(row).execute()
            print(f"[{idx}/{len(chunks)}] Uploaded section {chunk['section']} of {chunk['act']}")
            
            # Rate limiting baseline delay
            time.sleep(1.0)
            
        except Exception as e:
            print(f"Error processing chunk {idx} ({chunk.get('section', 'Unknown')}): {e}")


    print("Ingestion upload complete.")
