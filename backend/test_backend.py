"""
Developer test script for checking the LexAI backend pipeline locally.
"""

import os
import sys

# Reconfigure stdout to support UTF-8 printing in Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Ensure backend directory is in the path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from language import detect_language
from query_normalizer import normalize_query
from retriever import retrieve_documents
from llm import generate_response

print("=" * 60)
print("Running LexAI Backend Pipeline Test")
print("=" * 60)

# 1. Multilingual Query (Hinglish/Devanagari/Kannada)
test_queries = [
    "mujhe 3 mahine se salary nahi mili kya karu",
    "ನನ್ನ ಮಾಲೀಕರು ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ",
    "defective laptop delivered refund denied"
]

for q in test_queries:
    print(f"\n[Input Query]: '{q}'")
    
    # Language Detection
    lang = detect_language(q)
    print(f" -> Detected Language: {lang}")
    
    # Query Normalization
    normalized = normalize_query(q)
    print(f" -> Normalized Legal Query: '{normalized}'")
    
    # Document Retrieval
    chunks = retrieve_documents(normalized, match_count=3)
    print(f" -> Retrieved Chunks Count: {len(chunks)}")
    for i, c in enumerate(chunks):
        print(f"    - Chunk {i+1}: Act={c.get('act')}, Section={c.get('section')}, Score={c.get('score', 0.0)}")
    
    # LLM Answer Generation
    try:
        ans = generate_response(query=q, chunks=chunks, detected_language=lang)
        print(f"\n[Generated Answer ({lang})]:\n{ans}\n")
    except Exception as e:
        print(f" -> Error generating answer: {e}")
    
    print("-" * 60)
