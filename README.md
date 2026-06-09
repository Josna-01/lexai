# LexAI — Legal Aid Intelligence Agent

> Free, instant, multilingual access to Indian legal rights — for every citizen, on any phone.

---

## What Is LexAI?

LexAI is an AI-powered legal aid agent that bridges the gap between Indian citizens and the laws that protect them. A user describes their problem in plain Kannada, Hindi, or English. LexAI identifies the applicable legislation, retrieves the exact relevant sections from verified government documents, and returns a clear, cited, actionable response — in the user's language — telling them what their rights are and exactly how to act on them.

No lawyers. No jargon. No cost. No hallucination.

---

## The Problem

India has ~50 crore people who face legal disputes or rights violations every year. Fewer than 10% can afford legal counsel. The remaining 90% — daily wage workers, farmers, domestic workers, rural women, senior citizens — are left without guidance at the moments they need it most.

The barriers are linguistic, geographic, and systemic. The laws exist. The rights exist. The remedies exist. What does not exist is an accessible bridge between a person's problem and the law that solves it.

---

## Target Users

- Daily wage workers facing wage theft or unsafe working conditions
- Women in rural and semi-urban areas facing harassment or domestic violence
- Small business owners dealing with consumer disputes
- Students and young professionals facing cyber harassment or data privacy violations
- Senior citizens facing property disputes or pension grievances
- Any citizen who needs to understand their rights under Indian law

---

## Architecture Overview

LexAI is a three-layer RAG (Retrieval-Augmented Generation) system.

```
User Query (Kannada / Hindi / English)
        │
        ▼
┌─────────────────────────────┐
│     FastAPI Backend         │
│                             │
│  1. Embed query             │
│  2. Retrieve relevant       │
│     legal chunks from       │
│     Supabase pgvector       │
│  3. Pass chunks + query     │
│     to Gemini 1.5 Flash     │
│  4. Return cited response   │
└─────────────────────────────┘
        │
        ▼
React Chat UI (mobile-first)
```

---

## Tech Stack

### Knowledge Layer (Data Pipeline)
| Tool | Purpose |
|------|---------|
| `pdfplumber` | Extract text from Indian legislation PDFs |
| `pytesseract` | OCR fallback for scanned/image-based PDFs |
| Custom chunker | Split text by section with metadata tagging |
| Supabase pgvector | Vector database for storing embedded chunks |
| Gemini text-embedding-004 | Generate embeddings for chunks and queries |

### Intelligence Layer (Backend)
| Tool | Purpose |
|------|---------|
| FastAPI | Backend API server |
| LlamaIndex | RAG orchestration — retrieval pipeline |
| Gemini 1.5 Flash | LLM for multilingual answer generation |
| Python 3.11+ | Runtime |

### Interface Layer (Frontend)
| Tool | Purpose |
|------|---------|
| Google Stitch | UI design and component generation |
| React + TypeScript | Frontend framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Vercel | Frontend deployment |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Supabase | Database + vector storage + auth |
| Render / Railway | Backend deployment |
| GitHub | Version control |

### Development Tools
| Tool | Purpose |
|------|---------|
| GitHub Copilot | Code generation throughout all layers |
| Google Stitch | UI component design and prototyping |
| Antigravity | Primary IDE |

### Pluggable Intelligence Layer (Microsoft Foundry IQ Integration)
LexAI is built with a pluggable retriever architecture, allowing seamless switching between local open-source components and enterprise Microsoft infrastructure:

| Component | Local / Development Mode | Enterprise / Azure Mode |
|-----------|--------------------------|-------------------------|
| **Vector Index** | Supabase pgvector | Azure AI Search |
| **Embeddings** | Gemini text-embedding-004 | Azure OpenAI Embeddings |
| **Retriever Layer** | LlamaIndex PGVector | Microsoft Foundry IQ Retriever |

This is toggleable instantly in the configuration using the `RETRIEVER_TYPE` environment variable.


---

## Legal Knowledge Base

Initial corpus (MVP scope):

| Legislation | Coverage |
|-------------|---------|
| Consumer Protection Act, 2019 | Consumer disputes, refunds, complaints |
| Payment of Wages Act, 1936 | Wage theft, delayed payments, complaints |
| Bharatiya Nyaya Sanhita (BNS) | Harassment, assault, domestic violence sections |
| Right to Information Act, 2005 | Filing RTI applications |
| Protection of Women from Domestic Violence Act, 2005 | DV complaints, One Stop Centres |
| IT Act, 2000 | Cyber harassment, data privacy violations |

---

## Project Structure

```
lexai/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── retriever.py             # Main retriever router
│   ├── pgvector_retriever.py    # LlamaIndex + pgvector retrieval logic
│   ├── foundry_retriever.py     # Microsoft Foundry IQ retrieval logic
│   ├── llm.py                   # Gemini prompt + response generation
│   ├── models.py                # Pydantic request/response models
│   └── config.py                # Environment variables

│
├── ingestion/
│   ├── extract.py               # PDF text extraction (pdfplumber + pytesseract)
│   ├── chunk.py                 # Section-level chunking with metadata
│   ├── embed.py                 # Embedding generation + Supabase upload
│   └── data/
│       └── raw/                 # Raw legislation PDFs (not committed to Git)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── CitationTag.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
│
├── supabase/
│   └── schema.sql               # pgvector table + match_documents function
│
├── .env.example
├── requirements.txt
└── README.md
```

---

## Data Flow

### Ingestion Pipeline (run once per legislation)
```
Raw PDF
  → pdfplumber extracts text
  → pytesseract handles scanned pages
  → Chunker splits by section boundary
  → Each chunk tagged with {act, section, heading, year}
  → Gemini embedding generated per chunk
  → Stored in Supabase pgvector table
```

### Query Pipeline (every user message)
```
User message (any language)
  → Gemini embedding generated for query
  → pgvector cosine similarity search → top 5 chunks retrieved
  → Chunks + original query passed to Gemini 1.5 Flash
  → System prompt enforces: plain language, citations, procedural steps, lawyer fallback
  → Response returned with source citations
  → Displayed in chat UI with citation tags
```

---

## Supabase Schema

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Legal document chunks table
create table legal_chunks (
  id          uuid primary key default gen_random_uuid(),
  act         text not null,
  section     text,
  heading     text,
  year        int,
  content     text not null,
  embedding   vector(768),
  created_at  timestamptz default now()
);

-- Similarity search function
create or replace function match_documents(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (
  id        uuid,
  act       text,
  section   text,
  heading   text,
  content   text,
  similarity float
)
language sql stable
as $$
  select
    id, act, section, heading, content,
    1 - (embedding <=> query_embedding) as similarity
  from legal_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## System Prompt Design

The LLM layer uses a strict system prompt to prevent hallucination and enforce citation:

```
You are LexAI, a legal aid assistant for Indian citizens.
You will be given retrieved sections from verified Indian legislation.
Your job is to:
1. Identify which retrieved sections apply to the user's situation
2. Explain their rights in simple, plain language (no legal jargon)
3. Provide step-by-step procedural guidance on how to act
4. Cite every claim with the act name and section number
5. If the situation is ambiguous or requires professional judgment, say:
   "This situation may need a lawyer. Contact your nearest District Legal Services Authority (DLSA) for free legal aid."
6. Never reference any law section that was not in the retrieved context.
Only use information from the provided context. Never hallucinate legislation.
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Gemini
GEMINI_API_KEY=

# App
ENVIRONMENT=development
MAX_RETRIEVED_CHUNKS=5
```

---

## Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase project with pgvector enabled
- Gemini API key (free tier)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# fill in .env values
uvicorn main:app --reload
```

### Ingestion (run once)
```bash
cd ingestion
python extract.py --pdf data/raw/consumer_protection_act.pdf
python chunk.py
python embed.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Build Phases

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | PDF ingestion pipeline + Supabase pgvector setup | Planned |
| Phase 2 | Retrieval validation (20 test queries) | Planned |
| Phase 3 | LLM prompt layer + citation grounding | Planned |
| Phase 4 | React chat UI (mobile-first) | Planned |
| Phase 5 | End-to-end integration + deployment | Planned |
| Phase 6 | Foundry IQ migration (when Azure access available) | Future |

---

## Known Constraints & Decisions

**How is Microsoft Foundry IQ integrated?**
The backend is designed with a pluggable retriever pattern. By default, the application runs on a local Supabase pgvector instance for ease of development. By setting the environment variable `RETRIEVER_TYPE=foundry`, the application dynamically switches to the Microsoft Foundry IQ and Azure AI Search retriever module (`backend/foundry_retriever.py`), ensuring enterprise compatibility and compliance with Microsoft's agentic architecture.


**Why 4 acts for MVP?**
Retrieval quality degrades with too many documents in scope. Better to do 4 acts well — with validated retrieval — than 20 acts poorly. Corpus expands in later phases.

**Why Gemini over OpenAI?**
Free tier. Multilingual capability. Existing familiarity from SYNAPSE project.

**Why not voice input in MVP?**
Adds scope without validating the core retrieval hypothesis. Cut for MVP, added in Phase 2+ if demo goes well.

---

## Team

| Name | Role |
|------|------|
| Amisha Josna D'Souza | Lead Developer, System Architect |

---

## License

MIT

---

*LexAI — Knowledge is the first step to justice.*
