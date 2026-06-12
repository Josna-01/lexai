"""
CLI tool to run the document ingestion pipeline: Extract -> Chunk -> Embed -> Upload.
"""

import argparse
import os
from extract import extract_text_from_pdf
from chunk import chunk_text
from embed import upload_chunks


def main():
    parser = argparse.ArgumentParser(description="Ingest legal documents into Supabase pgvector.")
    parser.add_argument("--pdf", required=True, help="Path to the raw PDF file")
    parser.add_argument("--name", required=True, help="Official name of the Act/Legislation")
    parser.add_argument("--year", required=True, type=int, help="Year of the legislation")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf):
        print(f"Error: PDF file not found at {args.pdf}")
        return
        
    print(f"Starting pipeline for '{args.name}' ({args.year})...")
    
    # Step 1: Extract
    print("Step 1: Extracting text from PDF...")
    pages = extract_text_from_pdf(args.pdf)
    print(f"Extracted {len(pages)} pages.")
    
    # Step 2: Chunk
    print("Step 2: Splitting text into section-level chunks...")
    chunks = chunk_text(pages, act_name=args.name, act_year=args.year)
    print(f"Created {len(chunks)} chunks.")
    
    # Step 3: Embed & Upload
    print("Step 3: Generating embeddings and uploading to Supabase...")
    upload_chunks(chunks)
    
    print("Pipeline finished successfully!")


if __name__ == "__main__":
    main()
