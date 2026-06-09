"""
PDF text extraction logic using pdfplumber and pytesseract OCR fallback.
"""

import pdfplumber
import pytesseract


def extract_text_from_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text from a PDF file page by page.
    
    If pdfplumber fails to extract text from a page (returns empty/whitespace-only string),
    it falls back to pytesseract OCR.
    
    Args:
        pdf_path: Path to the PDF file.
        
    Returns:
        A list of dictionaries, where each dictionary has the keys:
        - 'page_num': 1-indexed page number (int)
        - 'text': Extracted text content (str)
    """
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            
            # If the extracted text is empty or whitespace-only, run OCR
            if not text or not text.strip():
                # Convert the PDF page to a PIL Image (300 DPI is recommended for OCR)
                img = page.to_image(resolution=300).original
                text = pytesseract.image_to_string(img)
            
            # Default to empty string if OCR also returned None
            if text is None:
                text = ""
                
            results.append({
                "page_num": i,
                "text": text.strip()
            })
            
    return results
