"""
Section-level chunking logic with metadata tagging.
"""

import re


def chunk_text(pages: list[dict], act_name: str, act_year: int) -> list[dict]:
    """
    Split extracted PDF page text into section-level chunks.
    
    Tries to identify section boundaries (e.g. "Section 12. ...", "12. ...")
    and associates each chunk with the metadata: act, section, heading, year.
    
    Args:
        pages: List of dicts with keys 'page_num' (int) and 'text' (str)
        act_name: The name of the legislation (str)
        act_year: The year the legislation was passed (int)
        
    Returns:
        A list of dictionaries, where each dictionary represents a chunk:
        - 'act': act_name
        - 'year': act_year
        - 'section': section number/identifier (str or None)
        - 'heading': section heading (str or None)
        - 'content': text content of the section (str)
    """
    # Combine pages into a single text stream with page markers
    # to facilitate cross-page section boundary detection.
    full_text_parts = []
    for p in pages:
        # Append a page indicator
        full_text_parts.append(f"\n[PAGE_{p['page_num']}]\n{p['text']}")
    
    full_text = "".join(full_text_parts)
    
    # Regex to find section boundaries.
    # Looks for a newline followed by optional "Section " followed by a number, followed by a dot or space.
    section_pattern = re.compile(
        r'(?:^|\n)(?:Section\s+)?(\d+[A-Z]?)\.?\s+([^\n]+)', 
        re.IGNORECASE
    )
    
    chunks = []
    
    # Find all matches
    matches = list(section_pattern.finditer(full_text))
    
    if not matches:
        # Fallback: if no clear sections are matched, split by page
        for p in pages:
            if p['text'].strip():
                chunks.append({
                    "act": act_name,
                    "year": act_year,
                    "section": "General",
                    "heading": f"Page {p['page_num']}",
                    "content": p['text'].strip()
                })
        return chunks
        
    for i, match in enumerate(matches):
        section_num = match.group(1)
        heading = match.group(2).strip()
        
        # Clean heading if it contains page markers or is too long
        heading = re.sub(r'\[PAGE_\d+\]', '', heading).strip()
        if len(heading) > 100:
            heading = heading[:97] + "..."
            
        start_idx = match.end()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        
        content = full_text[start_idx:end_idx].strip()
        # Clean page markers from content
        content = re.sub(r'\[PAGE_\d+\]', '', content).strip()
        
        if content:
            chunks.append({
                "act": act_name,
                "year": act_year,
                "section": section_num,
                "heading": heading,
                "content": content
            })
            
    return chunks
