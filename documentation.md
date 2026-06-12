# LexAI — Master Implementation Document for Antigravity

---

## 1. What is LexAI?

LexAI is a multilingual legal aid chatbot for Indian citizens. Its core mission: most Indians don’t know their legal rights. A landlord can harass, an employer can exploit, a police officer can misuse power — simply because the citizen doesn’t know what the law actually says. LexAI puts that knowledge directly in their hands, for free, in their own language.

Built for the Microsoft AI Skills Fest Hackathon — Battle #1: Creative Apps with GitHub Copilot. Deadline: June 14, 11:59 PM.

---

## 2. What LexAI Does — Three Features

### Feature 1: Legal Aid Chat Assistant

A citizen describes their problem in plain language — messy, emotional, incomplete, in Hindi/Kannada/English/Hinglish/Kanglish — and LexAI understands it, finds the relevant law, and explains it clearly with citations.

Examples of real input:

* “boss ne 3 mahine se paise nahi diye”
* “salary siglilla”
* “seller refund kodta illa”

LexAI normalizes all of these into clean legal retrieval queries.

---

### Feature 2: Legal Rights Simulator

A choose-your-own-adventure game where citizens play through real Indian legal scenarios and learn their rights through consequences of choices.

Exactly like those “choose your option” story games (Episode app / Duolingo style) — but for civic rights education.

User:

* picks a choice
* sees legal consequences
* gains or loses points
* learns the actual law section behind it

---

### Feature 3: LexAI MCP Server

Exposes LexAI’s legal knowledge base directly inside VS Code via Model Context Protocol.

GitHub Copilot can query Indian legislation while a developer is coding.

This is the hackathon standout — every other team builds with Copilot, LexAI becomes a Copilot capability.

---

## 3. Technology Stack

```text
Frontend           : React + Vite + Tailwind CSS
Backend            : FastAPI (Python)
Knowledge Base     : Foundry IQ (Azure AI Search F0)
LLM                : Gemini 2.5 Flash (free tier)
Language Detection : Azure AI Language Service (F0)
Query Normalizer   : Gemini-based multilingual normalization
Vector DB          : pgvector on Supabase (fallback only)
MCP Server         : Python mcp library (stdio)
Hosting Frontend   : Vercel (free)
Hosting Backend    : Render.com (free)
Auth               : Not needed for hackathon demo
```

Important:

* Do **NOT** deploy Azure OpenAI models.
* Gemini is the only LLM.
* Foundry IQ is retrieval only.

This keeps Azure credit consumption near zero.

---

## 4. Azure Setup (Already Done)

```text
✅ Azure account active (₹19,138.50 credit, expires July 11)
✅ Microsoft Foundry project created: lexai-legal
✅ No models deployed (zero credit consumption)
✅ Knowledge (Foundry IQ) page found in Build → Knowledge
✅ Auth Type set to API Key
❌ Azure AI Search F0 resource needs creation
❌ Knowledge base not created yet
❌ PDFs not uploaded yet
```

---

### Creating Azure AI Search Resource

In Foundry Knowledge page:

Click **Create new resource**

Fill:

```text
Name           : lexai-search
Region         : East US 2
Pricing Tier   : Free (F0)
Resource Group : rg-amishajosnadsouza.1-5992
```

Then:

* return to Knowledge page
* select `lexai-search`
* Auth Type = API Key
* Connect

---

### After Connecting — Create Knowledge Base

Upload these legislation PDFs:

```text
- Payment of Wages Act 1936
- Consumer Protection Act 2019
- IT Act 2000
```

Settings:

```text
❌ OCR
❌ Image extraction
❌ AI enrichment
✅ Plain text chunking only
```

Why?

* PDFs are text-based
* OCR unnecessary
* keeps cost zero

---

### Creating Azure Language Resource

Create Azure Language Service:

```text
Name   : lexai-language
Region : East US 2
Tier   : F0 Free
Group  : rg-amishajosnadsouza.1-5992
```

---

### Keys to Copy into `.env`

```env
AZURE_SEARCH_ENDPOINT=https://lexai-search.search.windows.net
AZURE_SEARCH_KEY=your-api-key-here
AZURE_SEARCH_INDEX=legal-knowledge

AZURE_LANGUAGE_ENDPOINT=https://lexai-language.cognitiveservices.azure.com
AZURE_LANGUAGE_KEY=your-language-key-here

GEMINI_API_KEY=your-gemini-key-here
```

User never sees this. Backend only.

---

## 5. How Foundry IQ Works in LexAI

Foundry IQ is NOT the LLM.

Gemini is the LLM.

Foundry IQ is the retrieval layer.

Without Foundry IQ:

```text
User question
   ↓
Gemini
   ↓
Answer from training data
(may hallucinate)
```

With Foundry IQ:

```text
User question
   ↓
Query normalization
   ↓
Foundry IQ retrieval
   ↓
Relevant legal chunks
   ↓
Gemini reasoning
   ↓
Grounded answer with citations
```

Example:

User asks in Hindi:

```text
mujhe 3 mahine se salary nahi mili
```

LexAI internally normalizes:

```text
Employer has not paid salary for 3 months
```

That query hits Foundry IQ.

Relevant chunks retrieved.

Gemini explains in Hindi.

Result:

* grounded
* cited
* multilingual
* less hallucination

---

## 6. How It’s Different From Secure Audits BNS Model

Secure Audits BNS approach:

```text id="m4u7tt"
Scraped raw data
   ↓
Built dataset
   ↓
Trained LegalBERT + HGAT
   ↓
Knowledge baked into model weights
   ↓
Predicts which BNS section applies
```

Characteristics:

* classification task
* trained model
* law knowledge inside weights
* updating requires retraining

---

LexAI approach:

```text id="q34wmy"
Original legislation PDFs
   ↓
Chunk + embed into Foundry IQ
   ↓
User asks question
   ↓
Retriever fetches relevant chunks
   ↓
Gemini reasons over chunks
   ↓
Returns answer with citations
```

Characteristics:

* question answering task
* retrieval + reasoning
* no retraining needed
* updating = upload new PDF

Example:

Need to add new law?

Secure Audits:

```text id="4v8bd3"
Rebuild dataset
Retrain model
```

LexAI:

```text id="9g2gfa"
Upload PDF
Done in minutes
```

Why RAG is correct here:

Citizens ask open-ended questions like:

* “Can my employer delay salary?”
* “Can seller refuse refund?”
* “Someone leaked my photo online”

These need:

* context understanding
* legal retrieval
* explanation

RAG is ideal.

---

## 7. Chat Assistant — Full Flow

```text id="8l36m4"
User types in any language, any format

Examples:
"boss ne 3 mahine se paise nahi diye kya karu"
"salary 2 months inda siglilla"
"seller refund kodta illa"

        ↓

Step 1: Azure Language Detection
→ Detect dominant language:
   hi / kn / en
→ Store preferred response language

        ↓

Step 2: Query Normalization (IMPORTANT)
Gemini converts messy multilingual input
into clean English legal retrieval query.

Handles:
- Hindi
- Kannada
- English
- Hinglish
- Kanglish
- slang
- spelling mistakes
- broken grammar

Examples:

"mujhe salary nahi mila 3 months se"
→ "Employer has not paid salary for 3 months"

"salary siglilla"
→ "Salary not received"

"refund kodta illa"
→ "Seller refused refund"

        ↓

Step 3: Slot Extraction
Extract:
- problem_type
- duration
- employment_type
- location
- urgency

        ↓

Step 4: Ask ONE clarifying question
ONLY if critical details are missing

Example:
"Are you full-time or contractual?"

        ↓

Step 5: Search English legal corpus
using normalized query

Foundry IQ / Azure AI Search

        ↓

Step 6: Retrieve top relevant law chunks
(No strict threshold for MVP)

        ↓

Step 7: Gemini reasons over retrieved law

        ↓

Step 8: Every legal claim cited

        ↓

Step 9: Final response in user's original language

        ↓

Step 10: If unclear or out-of-scope
→ Redirect to DLSA
```

---

### If User Has More Questions After Simulator

At any point:

```text id="jgbuh2"
💬 Ask LexAI about this
```

This opens chat assistant with scenario context preloaded.

Example:

Simulator scenario:

* withheld wages

User clicks:

```text id="9e7h44"
Ask LexAI
```

Chat already knows relevant context.

This creates product loop:

```text id="6z9wo3"
Simulator teaches
      ↓
Chat solves real problem
```

---

## 8. Safety Architecture — Preventing Wrong Legal Advice

### Rule 1: Clarifying Questions First

Example:

User:

```text id="q4n7dx"
My employer isn't paying me
```

LexAI:

```text id="9n73dr"
Quick question:
Are you full-time, contractual, or gig worker?
```

Only ask ONE question at a time.

Avoid interrogating user.

---

### Rule 2: Cite Every Claim

Good:

```text id="vrr7ru"
Under Section 5 of the Payment of Wages Act,
wages must be paid before the 7th day.
```

Bad:

```text id="y0oqmy"
Employer must pay on time.
```

No citation = weak legal answer.

---

### Rule 3: Retrieval Confidence Handling

Avoid strict threshold filtering initially.

Bad:

```python id="pfdp1w"
if similarity_score < 0.75:
    fallback()
```

Why bad?
Azure Search scores are not always normalized.

Better:

```text id="ol35he"
Retrieve top 3 chunks
→ Let Gemini decide relevance
```

If all chunks irrelevant:

* ask clarifying question
  OR
* redirect to DLSA

---

### Rule 4: Scope Boundaries

Supported:

```text id="x7l0oe"
✅ Labour law
✅ Consumer rights
✅ Cyber law
✅ Basic constitutional rights
```

Not supported:

```text id="n7f3ku"
❌ Criminal defense
❌ Property disputes
❌ Family law
❌ Tax matters
```

Redirect unsupported topics to DLSA.

---

### Rule 5: Language Discipline

Bad:

```text id="a7nvfo"
You should file complaint immediately.
```

Better:

```text id="n0t4vt"
The law provides you the right to file a complaint.
```

LexAI informs.

LexAI does not act as lawyer.

---

## 9. System Prompt for Gemini

```python id="0ur4j7"
system_prompt = """
You are LexAI, an Indian legal aid assistant
helping citizens understand their rights for free.

Before answering:

1. Identify user's legal problem

2. If key details missing,
ask ONE clarifying question

3. Only answer using retrieved law sections

4. Cite every legal claim:
section + act + page

5. Respond in user's language

6. The legal corpus is English-only.
A normalized English retrieval query
will be provided separately.

7. User input may contain:
- Hindi
- Kannada
- English
- Hinglish
- Kanglish
- slang
- spelling mistakes
- broken grammar

Understand messy multilingual input naturally.

8. If retrieval unclear or topic
is out-of-scope → say so and redirect to DLSA

9. Never say "you should"
Say:
"The law provides..."

10. End every answer with:
"For your specific situation,
DLSA can help confirm."
"""
```

Chat flow:

```python id="1f3d65"
language = detect_language(user_message)
normalized_query = normalize_query(user_message)
docs = retrieve_laws(normalized_query)
```

Then Gemini answers in original language.

---

## 10. Legal Rights Simulator — Detailed Spec

### Three Scenarios

```text id="4k5npu"
🏭 The Withheld Wages
Law: Payment of Wages Act
Character: Ravi, factory worker

🛒 The Defective Refund
Law: Consumer Protection Act
Character: Priya, online shopper

💻 The Cyber Harassment
Law: IT Act
Character: Aisha, student
```

---

### Game Structure

```text id="0a0t1m"
4–5 decision nodes per scenario
Each node:
- story text
- 4 choices
- score change
- legal explanation
```

Important architecture change:

### Scenario branching = hardcoded

Example:

```text id="nwhn09"
Choice A → Node 2
Choice B → Node 3
Choice C → Node 4
```

This keeps logic simple and deterministic.

---

### Legal Explanation = AI-powered

Only explanation uses:

* Foundry IQ
* Gemini

This reduces complexity while keeping AI value.

---

### Example Flow — Withheld Wages

```text id="5bn9v2"
━━━━━━━━━━━━━━━━━━━━━━
Legal Knowledge: ████░░ 40%
━━━━━━━━━━━━━━━━━━━━━━

You are Ravi.
You work in a textile factory.

Your employer hasn't paid salary
for 3 months.

What do you do?

[A] Keep waiting
[B] Call Labour Commissioner
[C] Message friends
[D] File police complaint
```

Pick B:

```text id="8mvl76"
✅ CORRECT MOVE

Labour Commissioner may help recover unpaid wages.

Source:
Payment of Wages Act Section 15

+20 points
```

Pick A:

```text id="y89p9n"
⚠️ RISKY MOVE

Waiting gives no legal protection.

-10 points
```

End screen:

```text id="5sy3fi"
🏆 Score: 80/100
Badge: Legal Champion

Need real help?
→ Contact DLSA

💬 Ask LexAI
```

---

## 11. LexAI MCP Server — Full Spec

### Purpose

LexAI MCP Server exposes legal retrieval tools inside **[Visual Studio Code](https://code.visualstudio.com/?utm_source=chatgpt.com)** so **[GitHub Copilot](https://github.com/features/copilot?utm_source=chatgpt.com)** can directly access Indian legislation.

This is the hackathon differentiator.

Instead of just using Copilot to write code, LexAI becomes a capability inside Copilot.

---

### What It Exposes

```python id="4l7s8a"
# Tool 1
search_laws(query: str, limit: int = 5)

# Tool 2
explain_law_section(act: str, section: str, content: str)
```

---

### Tool 1 — search_laws

Purpose:

```text id="27ebyb"
User / Copilot asks legal question
        ↓
MCP tool calls Foundry IQ
        ↓
Returns cited law chunks
```

Example query:

```text id="8jajry"
salary withheld by employer
```

Returns:

```json id="a6x0rv"
[
  {
    "act": "Payment of Wages Act",
    "section": "15",
    "content": "...",
    "source": "PDF"
  }
]
```

---

### Tool 2 — explain_law_section

Purpose:

Convert legal text into plain language.

Example:

Input:

```text id="k5n9j7"
Section 15 Payment of Wages Act
```

Output:

```text id="1r9npx"
This section allows employees to file
claims for delayed wages through
the Labour Commissioner.
```

Can explain in:

* English
* Hindi
* Kannada

---

### Prompt Resource

Prompt resource:

```text id="n8gtmf"
legal-expert-chat
```

This primes Copilot to behave as Indian legal assistant.

---

### VS Code Configuration

`.vscode/mcp.json`

```json id="y7sqqg"
{
  "mcp.servers": {
    "lexai-helper": {
      "command": "python",
      "args": ["c:/Users/amish/lexai/backend/mcp_server.py"]
    }
  }
}
```

---

### Demo Query

Use this during demo recording:

```text id="3aaxea"
How does the Payment of Wages Act protect me
from delayed salary? Ask LexAI helper.
```

Flow:

```text id="l3n1v8"
Copilot
   ↓
MCP tool call
   ↓
search_laws()
   ↓
Foundry IQ
   ↓
Cited answer
```

---

## 12. Files to Build

```text id="vvdrxt"
backend/
  mcp_server.py          ← NEW
  scenarios.py           ← NEW
  query_normalizer.py    ← NEW
  retriever.py           ← MODIFY
  main.py                ← MODIFY
  language.py            ← NEW

frontend/
  src/components/
    ScenarioSimulator.tsx ← NEW
  src/App.tsx             ← MODIFY

.vscode/
  mcp.json               ← NEW

.env                     ← MODIFY
requirements.txt         ← MODIFY
README.md                ← NEW
```

---

## 13. Backend Endpoints to Add

### Chat Endpoint

Existing:

```python id="nlsxbn"
POST /api/chat
```

Modify to use:

* language detection
* query normalization
* Foundry IQ retrieval
* Gemini response

---

### Simulation Endpoints

#### Get scenarios

```python id="akqrfz"
GET /api/simulation/scenarios
```

Returns metadata for 3 scenarios.

Example response:

```json id="p6xpl9"
[
  {
    "id": 1,
    "title": "Withheld Wages"
  }
]
```

---

#### Simulation step

```python id="w7e9qn"
POST /api/simulation/step
```

Input:

```json id="t7xlf0"
{
  "scenario_id": 1,
  "current_node_id": 2,
  "user_choice": "B"
}
```

Process:

```text id="kwg1ch"
1. Resolve next node via hardcoded branching
2. Retrieve relevant law chunks
3. Gemini explains legal consequence
4. Return score delta + explanation
```

Output:

```json id="vvtkkf"
{
  "grade": "correct",
  "explanation": "...",
  "citation": "...",
  "score_delta": 20,
  "next_node": 3
}
```

---

## 14. retriever.py Changes

Move from:

* Supabase primary retrieval

To:

* Foundry IQ primary retrieval
* Supabase fallback only

Implementation:

```python id="85h2dr"
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import os
```

Retriever:

```python id="4f5ejn"
def retrieve_laws(query: str, limit: int = 5):
    client = SearchClient(
        endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
        index_name=os.getenv("AZURE_SEARCH_INDEX"),
        credential=AzureKeyCredential(
            os.getenv("AZURE_SEARCH_KEY")
        )
    )

    results = client.search(
        search_text=query,
        top=limit,
        include_total_count=True
    )

    chunks = []

    for result in results:
        chunks.append({
            "content": result["content"],
            "source": result["source"],
            "score": result["@search.score"],
            "section": result.get("section", ""),
            "act": result.get("act", "")
        })

    if not chunks:
        return []

    return chunks[:3]
```

Important:
No strict 0.75 threshold for MVP.

Why?
Azure search scores are not always normalized.

Instead:

* retrieve top 3
* let Gemini judge relevance

---

## 14B. Language Detection Code

Use **[Azure AI Language Service](https://azure.microsoft.com/en-us/products/ai-services/ai-language?utm_source=chatgpt.com)**

```python id="7q27jc"
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
import os
```

Initialize:

```python id="jwr7xh"
language_client = TextAnalyticsClient(
    endpoint=os.getenv("AZURE_LANGUAGE_ENDPOINT"),
    credential=AzureKeyCredential(
        os.getenv("AZURE_LANGUAGE_KEY")
    )
)
```

Detection:

```python id="jlwm6o"
def detect_language(text: str) -> str:
    try:
        result = language_client.detect_language(
            documents=[{"id": "1", "text": text}]
        )
        return result[0].primary_language.iso6391_name
    except Exception:
        return "en"
```

Returns:

* `hi`
* `kn`
* `en`

Fallback:

* English

---

## 14C. Query Normalization Code (NEW)

This is critical because:

```text id="nh80yw"
Legal PDFs = English only
User input = multilingual
```

So retrieval query must be normalized.

Examples:

```text id="gqsn8u"
mujhe salary nahi mila
→ Employer has not paid salary

salary siglilla
→ Salary not received

refund kodta illa
→ Seller refused refund
```

Implementation:

```python id="xfq7cq"
def normalize_query(user_message: str) -> str:
```

Gemini prompt:

```python id="u9lbk9"
prompt = """
You are a legal query normalizer for Indian users.

Input may contain:
- English
- Hindi
- Kannada
- Hinglish
- Kanglish
- slang
- spelling mistakes
- broken grammar

Convert the input into concise English
legal retrieval query.

Return ONLY normalized query.
"""
```

Pipeline:

```text id="xrcj3r"
User message
     ↓
detect_language()
     ↓
normalize_query()
     ↓
retrieve_laws()
     ↓
Gemini final answer
```

---

## 15. requirements.txt Additions

Add these dependencies:

```txt
fastapi
uvicorn
google-generativeai

azure-search-documents
azure-core
azure-ai-textanalytics

mcp

supabase
pgvector

python-dotenv
pydantic
```

Purpose:

```text id="ahkr9j"
fastapi                  → backend API
google-generativeai     → Gemini integration
azure-search-documents  → Foundry IQ retrieval
azure-ai-textanalytics  → language detection
mcp                     → VS Code MCP server
supabase + pgvector     → optional fallback retrieval
```

---

## 16. README Structure (Required for Judging)

Your GitHub README should look like this:

```markdown
# LexAI — Multilingual Legal Aid for Indian Citizens

## Problem Statement
Why Indian citizens struggle with legal awareness

## What LexAI Does
- Legal Chat Assistant
- Rights Simulator
- MCP Server

## Microsoft IQ Integration
- Foundry IQ
- Azure AI Search
- Azure Language Service

## How GitHub Copilot Assisted Development
### Inline Suggestions Used For
### Copilot Chat Used For
### MCP Integration

## Architecture Diagram

## Multilingual Pipeline
Hindi/Kannada → English retrieval → native response

## Simulator Scenarios
- Withheld Wages
- Defective Refund
- Cyber Harassment

## Safety Design
- Clarifying questions
- Citations
- DLSA fallback

## How to Run Locally

## Deployment
```

Judges care about:

* architecture clarity
* Copilot usage proof
* Microsoft IQ usage proof

---

## 17. GitHub Copilot Strategy

Current quota situation:

```text id="3vnsys"
Inline suggestions : plenty
Copilot Chat       : limited (~21% left)
```

Strategy:

### During Development

Use:

* Antigravity / main IDE for backend coding
* Copilot minimally

Avoid wasting Copilot Chat on:

* boilerplate
* normal coding
* long debugging loops

---

### Use Copilot For High-Value Tasks Only

Good use cases:

```text id="bgsm2r"
✅ MCP testing
✅ VS Code integration
✅ Demo recording
✅ Final validation
```

Bad use cases:

```text id="l9i4kr"
❌ writing backend boilerplate
❌ repeated debugging loops
❌ frontend styling
```

Rule:

```text id="dzkrui"
Build everything in Antigravity.

Reserve GitHub Copilot primarily for:
- MCP testing
- VS Code integration
- Demo recording

Avoid spending Copilot Chat credits
during backend development.
```

---

## 18. Deployment Plan

### Frontend

Deploy React app to **[Vercel](https://vercel.com/?utm_source=chatgpt.com)**

Flow:

```text id="13f1w6"
Push GitHub repo
      ↓
Vercel auto deploy
      ↓
Get public URL
```

Example:

```text id="9pjmbs"
lexai.vercel.app
```

---

### Backend

Deploy FastAPI to **[Render](https://render.com/?utm_source=chatgpt.com)**

Flow:

```text id="v8p0e9"
Connect GitHub repo
      ↓
Set env variables
      ↓
Auto deploy
```

Required env vars:

```env id="7h1oy8"
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_KEY=
AZURE_SEARCH_INDEX=

AZURE_LANGUAGE_ENDPOINT=
AZURE_LANGUAGE_KEY=

GEMINI_API_KEY=
```

---

### Knowledge Base

Hosted on:

* **[Microsoft Foundry IQ](https://azure.microsoft.com/en-us/products/ai-foundry/iq?utm_source=chatgpt.com)**
* backed by **[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search?utm_source=chatgpt.com)**

---

### Database

Optional fallback:

* **[Supabase](https://supabase.com/?utm_source=chatgpt.com)**
* pgvector enabled

Only used if Azure retrieval unavailable.

---

### Cost

```text id="bvlryq"
Azure credits consumed : ~₹0 to minimal
Frontend hosting       : $0
Backend hosting        : $0
Database               : Free tier
```

Total:
Essentially free for hackathon.

---

## 19. Build Order (Updated — Important)

Build in this exact order.

---

### Phase 1 — Foundation (June 12)

1. Create Azure AI Search F0 resource
2. Connect to Foundry project
3. Upload legislation PDFs
4. Copy endpoint + key into `.env`
5. Update `retriever.py`
6. Build `language.py`
7. Build `query_normalizer.py`
8. Test chat pipeline

Test retrieval:

```bash id="w3tkul"
python -c "from retriever import retrieve_laws;
print(retrieve_laws('salary withheld'))"
```

Test language:

```bash id="fyck8g"
python -c "from language import detect_language;
print(detect_language('mujhe nahi pata kya karna hai'))"
```

Expected:

```text id="qvpk5h"
hi
```

---

### Phase 2 — Simulator Backend (June 13 Morning)

9. Build `scenarios.py`
10. Add:

```text id="zj5rjr"
GET /api/simulation/scenarios
POST /api/simulation/step
```

11. Test endpoints with curl / Postman

Goal:
Backend simulator fully working.

---

### Phase 3 — Simulator Frontend (June 13 Afternoon)

12. Build `ScenarioSimulator.tsx`
13. Add simulator toggle in `App.tsx`
14. Add **Ask LexAI** handoff button
15. Test complete simulator flow

Goal:
User can play all 3 scenarios.

---

### Phase 4 — MCP Server (June 13 Evening / June 14)

Important:
MCP comes **after core product**.

16. Build `mcp_server.py`
17. Add `mcp` dependency
18. Create `.vscode/mcp.json`
19. Test inside VS Code + Copilot

Goal:
Copilot can call:

* `search_laws`
* `explain_law_section`

---

### Phase 5 — Polish

20. Add DLSA fallback responses
21. Build README
22. Add architecture diagram
23. Improve UI polish

Optional:

* animations
* badges
* glassmorphism

Do only if time remains.

---

### Phase 6 — Deploy

24. Deploy frontend → Vercel
25. Deploy backend → Render
26. End-to-end test deployed app
27. Fix deployment bugs

---

### Phase 7 — Demo

28. Open VS Code
29. Verify MCP tools load
30. Ask Copilot test query
31. Record demo video
32. Fill submission form
33. Submit before deadline

---

## 20. What Makes This Win

LexAI is not just another chatbot. It combines creativity, real-world impact, and Microsoft ecosystem usage in a way that aligns strongly with the hackathon judging criteria.

---

### One — You Extended Copilot, Not Just Used It

Most teams will simply use **[GitHub Copilot](https://github.com/features/copilot?utm_source=chatgpt.com)** to write code.

LexAI goes further.

It adds an **MCP server**, turning LexAI into a capability *inside Copilot*.

That means:

```text id="ut2f94"
Copilot
   ↓
calls LexAI tools
   ↓
retrieves Indian law
   ↓
returns grounded answer
```

This directly matches the challenge’s encouragement for:

* MCP servers
* Copilot integrations
* AI-assisted development

This is a strong differentiator.

---

### Two — Real Microsoft IQ Integration

LexAI uses real Microsoft intelligence infrastructure:

* **[Microsoft Foundry IQ](https://azure.microsoft.com/en-us/products/ai-foundry/iq?utm_source=chatgpt.com)**
* **[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search?utm_source=chatgpt.com)**
* **[Azure AI Language Service](https://azure.microsoft.com/en-us/products/ai-services/ai-language?utm_source=chatgpt.com)**

This is not a fake README mention.

Real legal PDFs are uploaded.

Real retrieval happens.

Every answer is grounded in actual law.

---

### Three — Genuine Human Impact

This is the strongest story.

LexAI helps citizens who:

* cannot afford lawyers
* do not know their rights
* struggle with legal English
* fear authority or exploitation

Examples:

* unpaid wages
* refund denial
* cyber harassment
* civic rights violations

This gives the project emotional weight.

Judges remember projects with strong human impact.

---

### Four — Creative Differentiator

Many AI apps are:

* chatbots
* summarizers
* dashboards

LexAI adds something memorable:

### Civic Rights as a Game

The simulator turns legal education into:

```text id="r3e7li"
play
 ↓
choose
 ↓
learn consequence
 ↓
understand law
```

This is highly creative.

Very few teams will do this.

---

### Five — Safety-First Design

Legal AI is high-risk.

LexAI explicitly handles failure cases.

Safety mechanisms:

```text id="r56b1j"
✅ Clarifying questions
✅ Citation requirement
✅ Scope boundaries
✅ DLSA fallback
✅ Confidence-aware retrieval
```

This shows maturity.

Judges appreciate teams that think about misuse and hallucination.

---

### Six — Complete Product Loop

LexAI is not one isolated feature.

It has a complete user journey:

```text id="wd3q2s"
Simulator teaches rights
         ↓
User becomes curious
         ↓
Ask LexAI
         ↓
Chat solves real problem
```

Education + practical help.

That product loop is strong.

---

### Seven — Multilingual Legal Accessibility

This is a major innovation.

India is multilingual.

Users may speak:

* English
* Hindi
* Kannada
* Hinglish
* Kanglish

LexAI handles messy real-world language.

Pipeline:

```text id="fvlwzm"
Hindi/Kannada input
        ↓
Language detection
        ↓
Query normalization
        ↓
English legal retrieval
        ↓
Response in native language
```

Example:

Input:

```text id="75oq8s"
salary siglilla
```

Internal retrieval:

```text id="n6y6go"
Salary not received
```

Output:
Kannada explanation.

This dramatically improves accessibility.

---

### Eight — Zero-Cost Practical Deployment

LexAI is designed for hackathon practicality.

Cost:

```text id="ygjwh7"
Azure        : Free tier
Vercel       : Free
Render       : Free
Gemini Flash : Free tier
```

That means:

* easy to demo
* easy to deploy
* no expensive infrastructure

---

## 21. Immediate First Task for Antigravity

Current blocker:

### Azure AI Search resource not created yet

This is the first required step.

Go to:

**Microsoft Foundry → Build → Knowledge**

Scroll down.

Click:

```text id="j7oz3u"
Create new resource
```

Fill:

```text id="m8o1mb"
Name           : lexai-search
Region         : East US 2
Tier           : Free F0
Resource Group : rg-amishajosnadsouza.1-5992
```

Create resource.

Then:

1. Return to Knowledge page
2. Select `lexai-search` from dropdown
3. Click Connect
4. Create knowledge base
5. Upload legislation PDFs
6. Copy endpoint + key to `.env`

After Azure setup is complete:

### Start Phase 1 Implementation

Priority order:

```text id="rgql2d"
1. Build retriever.py
2. Build language.py
3. Build query_normalizer.py
4. Test chat pipeline
```

Important development rule:

```text id="14g0to"
Core product first.
MCP later.
Fancy UI last.
```

Success criteria for tonight:

```text id="j63nbn"
User asks:
"mujhe salary nahi mili"

LexAI:
1. detects Hindi
2. normalizes query
3. retrieves law
4. answers in Hindi with citation
```

If this works:

### LexAI core is alive.

Everything after that is enhancement.

---

# Final Guiding Principle

When confused about priorities, follow this rule:

```text id="4wwg7g"
Working product > Perfect architecture
Core functionality > Bonus features
Reliable demo > Fancy polish
```

Build the thing that works.

Then improve it.

That is how LexAI wins.

<!-- # LexAI — Master Implementation Document for Antigravity

---

## 1. What is LexAI?

LexAI is a multilingual legal aid chatbot for Indian citizens. Its core mission: most Indians don't know their legal rights. A landlord can harass, an employer can exploit, a police officer can misuse power — simply because the citizen doesn't know what the law actually says. LexAI puts that knowledge directly in their hands, for free, in their own language.

Built for the Microsoft AI Skills Fest Hackathon — Battle #1: Creative Apps with GitHub Copilot. Deadline: June 14, 11:59 PM.

---

## 2. What LexAI Does — Three Features

### Feature 1: Legal Aid Chat Assistant

A citizen describes their problem in plain language — messy, emotional, incomplete, in Hindi/Kannada/English — and LexAI understands it, finds the relevant law, and explains it clearly with citations.

### Feature 2: Legal Rights Simulator

A choose-your-own-adventure game where citizens play through real Indian legal scenarios and learn their rights through consequences of choices. Exactly like those "choose your option" story games (Episode app, Duolingo format) — but for civic rights education. User picks a choice, sees what happens legally, earns or loses points, learns the actual law section behind it.

### Feature 3: LexAI MCP Server

Exposes LexAI's legal knowledge base directly inside VS Code via Model Context Protocol. GitHub Copilot can query Indian legislation while a developer is coding. This is the hackathon standout — every other team builds with Copilot, LexAI becomes a Copilot capability.

---

## 3. Technology Stack

```
Frontend         : React + Vite + Tailwind CSS
Backend          : FastAPI (Python)
Knowledge Base   : Foundry IQ (Azure AI Search F0 — free tier)
LLM              : Gemini 2.5 Flash (free tier, NOT Azure OpenAI)
Language Detection : Azure AI Language Service (F0 — free tier)
Vector DB        : pgvector on Supabase (local fallback)
MCP Server       : Python mcp library (stdio-based)
Hosting Frontend : Vercel (free)
Hosting Backend  : Render.com (free)
Auth             : Not needed for hackathon demo — remove login walls
```

Important: Do NOT deploy any Azure OpenAI models. Gemini is the LLM. Foundry IQ is only the retrieval layer. This keeps Azure credit consumption at zero.

---

## 4. Azure Setup (Already Done)

```
✅ Azure account active (₹19,138.50 credit, expires July 11)
✅ Microsoft Foundry project created: lexai-legal
✅ No models deployed (zero credit consumption)
✅ Knowledge (Foundry IQ) page found in Build → Knowledge
✅ Auth Type set to API Key (correct, keep this)
❌ Azure AI Search F0 resource needs to be created
❌ Knowledge base not created yet
❌ PDFs not uploaded yet
```

### Creating the Azure AI Search Resource

In the Foundry Knowledge page, click "Create new resource" and fill:

```
Name           : lexai-search
Region         : East US 2
Pricing tier   : Free (F0) ← critical, must be this
Resource group : rg-amishajosnadsouza.1-5992
```

Then come back to Knowledge page, select lexai-search from dropdown, Auth Type API Key, click Connect.

### After Connecting — Create Knowledge Base

Upload exactly 3 PDFs:
```
- Payment of Wages Act 1936
- Consumer Protection Act 2019
- IT Act 2000
```

Settings when uploading:
```
❌ Do NOT enable OCR
❌ Do NOT enable image extraction
❌ Do NOT enable AI enrichment skills
✅ Plain text chunking only
```

These settings keep cost at zero. The PDFs are text-based, not scanned images, so OCR is not needed.

### Creating Azure Language Resource

In the Azure Portal, create a Language Service resource:
```
Name   : lexai-language
Region : East US 2
Tier   : F0 Free ← must be this, zero cost
Group  : rg-amishajosnadsouza.1-5992
```

### Keys to Copy into .env

```
AZURE_SEARCH_ENDPOINT=https://lexai-search.search.windows.net
AZURE_SEARCH_KEY=your-api-key-here
AZURE_SEARCH_INDEX=legal-knowledge
AZURE_LANGUAGE_ENDPOINT=https://lexai-language.cognitiveservices.azure.com
AZURE_LANGUAGE_KEY=your-language-key-here
GEMINI_API_KEY=your-gemini-key-here
```

User never sees any of this. It's all backend.

---

## 5. How Foundry IQ Works in LexAI

Foundry IQ is NOT the LLM. Gemini is the LLM. Foundry IQ is purely the retrieval layer.

```
Without Foundry IQ:
User question → Gemini → answer from training data
(can hallucinate, not grounded in actual Indian law)

With Foundry IQ:
User question → Foundry IQ → retrieves actual law chunks
→ Gemini reads those chunks → answer grounded in real law
(cited, verifiable, not hallucinated)
```

The user never sees Foundry IQ. FastAPI calls it silently in the backend. User just sees a well-cited answer.

---

## 6. How It's Different From Secure Audits BNS Model

Secure Audits BNS approach (major project):
```
Scraped raw data → built dataset → trained LegalBERT + HGAT
→ knowledge baked into model weights
→ predicts which BNS section applies to a crime
→ classification task
→ to update: retrain entire model
```

LexAI RAG approach:
```
Original legislation PDFs stored as-is
→ chunked and embedded into Foundry IQ
→ user asks question
→ retriever fetches relevant chunks live
→ Gemini reads chunks and answers
→ question answering task
→ to update: re-upload PDF, done in 2 minutes
```

Why RAG is right here: Citizens ask open-ended questions needing explanation — that is retrieval plus reasoning, RAG's strength. BNS classification is a classification task — trained model is better there. Right tool for each problem.

---

## 7. Chat Assistant — Full Flow

```
User types in any language, any format
"boss ne 3 mahine se paise nahi diye kya karu"
        ↓
Step 1: Azure Language Detection (free API call)
→ Detects: "hi" (Hindi) / "kn" (Kannada) / "en" (English)
→ Stored in conversation context
→ All subsequent responses in this language
        ↓
Step 2: Slot extraction
        problem_type: salary_withheld
        duration: 3 months
        employment_type: unknown → ask this
        location: unknown → ask this
        ↓
Step 3: Ask ONE clarifying question
"Are you a full-time employee or contractual worker?"
        ↓
Step 4: Once context is complete,
rewrite query internally:
"Legal remedies for full-time employee whose employer
withheld salary for 3 months under Indian labour law"
        ↓
Step 5: Clean query hits Foundry IQ
        ↓
Step 6: Similarity score check
        score < 0.75 → "Please contact DLSA"
        score > 0.75 → proceed
        ↓
Step 7: Gemini reads retrieved chunks + full
conversation history and generates answer
        ↓
Step 8: Every claim cited to source PDF + section
        ↓
Step 9: Response in user's original language
        ↓
Step 10: End with DLSA fallback line
```

### If User Has More Questions After Simulator

At any point in the simulator or at the end, a button appears:
```
💬 Ask LexAI about this
```
This opens the chat assistant with the scenario context pre-loaded. The RAG already has relevant legislation in context. User's specific real situation gets answered by the full pipeline. Simulator hooks them, chat actually helps them.

---

## 8. Safety Architecture — Preventing Wrong Legal Advice

### Rule 1: Clarifying Questions First
```
User: "My employer isn't paying me"

LexAI: "Quick questions before I look this up:
• Full-time or contractual/gig worker?
• Private company or government?
• Which state?
• How many months unpaid?"
```

### Rule 2: Cite Every Claim
```
✅ "Under Section 5 of the Payment of Wages Act,
   1936, wages must be paid by the 7th of every
   month. [Source: Payment of Wages Act PDF, Page 4]"

❌ "Your employer must pay you on time."
```
No citation means no claim. If retriever returns nothing relevant, say so and direct to DLSA.

### Rule 3: Confidence Threshold
```python
if similarity_score < 0.75:
    return "I'm not confident enough to give legal
    advice here. Please contact DLSA for free legal aid."
```

### Rule 4: Scope Boundaries
```
Covers:
✅ Labour law
✅ Consumer rights
✅ Cyber law
✅ Basic constitutional rights

Does not cover:
❌ Criminal defense
❌ Property disputes
❌ Family law
❌ Tax matters
→ Redirect all of these to DLSA
```

### Rule 5: Language Discipline
```
❌ "You should file a complaint immediately"
✅ "The law provides you the right to file a
   complaint under Section 15. Whether to do
   so depends on your specific situation."
```

---

## 9. System Prompt for Gemini

```python
system_prompt = """
You are LexAI, an Indian legal aid assistant
helping citizens understand their rights for free.

Before answering any legal question:
1. Identify what legal problem the user has
2. If employment type, state, or key details
   are missing — ask ONE clarifying question first
3. Rewrite their question into precise legal
   terminology internally before retrieval
4. Only answer using retrieved law sections
5. Cite every claim: section number + act name + page
6. Respond in the same language the user wrote in.
   The detected language code will be passed to you
   as: detected_language={language_code}
   hi = Hindi, kn = Kannada, en = English
7. If retrieval confidence is low or topic is
   out of scope — say so and direct to DLSA
8. Never say "you should" — say "the law provides"
9. End every answer with: "For your specific
   situation, a free lawyer at DLSA can confirm."

Scope: Labour law, Consumer rights, Cyber law,
Constitutional rights only.

Out of scope: Criminal defense, property disputes,
family law, taxation — always redirect to DLSA.
"""

async def chat(user_message: str, history: list):
    language = detect_language(user_message)

    messages = [
        {
            "role": "system",
            "content": system_prompt + f"\ndetected_language={language}"
        },
        *history,
        {
            "role": "user",
            "content": user_message
        }
    ]
    # rest of Gemini call
```

---

## 10. Legal Rights Simulator — Detailed Spec

### Three Scenarios

```
🏭 The Withheld Wages
   Law: Payment of Wages Act, 1936
   Character: Ravi, factory worker, Mangaluru

🛒 The Defective Refund
   Law: Consumer Protection Act, 2019
   Character: Priya, online shopper

💻 The Cyber Harassment
   Law: IT Act, 2000
   Character: Aisha, college student
```

### Game Structure Per Scenario

```
4-5 decision nodes per scenario
Each node: story text + 4 choices
Each choice: graded by RAG + Gemini
Right choice: +20 points + law explanation + citation
Wrong choice: -10 points + what actually happens legally
End: score + badge + DLSA contact + Ask LexAI button
```

### Example Flow — Withheld Wages

```
━━━━━━━━━━━━━━━━━━━━━━━━
Legal Knowledge: ████░░  40%
━━━━━━━━━━━━━━━━━━━━━━━━

📖 You're Ravi. You work at a textile factory
in Mangaluru. Your boss hasn't paid you in
3 months. Today he says "come back next week."

What do you do?

[ A ] Keep waiting, don't want to lose the job
[ B ] Call the Labour Commissioner
[ C ] Send WhatsApp to friends
[ D ] File a police complaint
```

Pick B:
```
✅ CORRECT MOVE
Labour Commissioner has authority under
Payment of Wages Act, 1936 to order immediate
payment + penalty from employer.
📄 Source: Section 15, Payment of Wages Act
[View actual law →]
+20 Legal Points
```

Pick A:
```
⚠️ RISKY MOVE
Waiting has no legal protection.
After 3 years your claim expires under
the Limitation Act.
-10 Legal Points
```

End screen:
```
🏆 YOU SCORED 80/100
Badge: Legal Champion ⚖️

Need real help right now?
→ Contact Karnataka DLSA (Free Legal Aid)
→ Call: 080-XXXXXXX

💬 Have more questions? Ask LexAI →
```

### How Simulator Uses RAG

Every choice evaluation hits Foundry IQ live. The explanation shown is grounded in retrieved law sections, not hardcoded. Each scenario also has hardcoded fallback law sections in case retrieval confidence is low — for demo reliability.

---

## 11. LexAI MCP Server — Full Spec

### What It Exposes

```python
# Tool 1: search_laws
# Queries Foundry IQ, returns cited law chunks
search_laws(query: str, limit: int = 5)

# Tool 2: explain_law_section
# Gemini explains in plain English/Hindi/Kannada
explain_law_section(act: str, section: str, content: str)

# Prompt resource: legal-expert-chat
# Primes Copilot as Indian Legal Aid assistant
```

### VS Code Configuration File

This file must be committed to the repo so it works immediately when opened in VS Code for demo:

```json
// .vscode/mcp.json
{
  "mcp.servers": {
    "lexai-helper": {
      "command": "python",
      "args": ["c:/Users/amish/lexai/backend/mcp_server.py"]
    }
  }
}
```

### The Demo Query (One Message, Saved for Recording)

```
"How does the Payment of Wages Act protect me
from delayed salary? Ask LexAI helper."
```

Copilot requests permission to run search_laws → hits Foundry IQ → returns cited answer. Record this. That is the demo.

---

## 12. Files to Build

```
backend/
  mcp_server.py           ← NEW: stdio MCP server
  scenarios.py            ← NEW: 3 scenario decision trees
  retriever.py            ← MODIFY: point to Foundry IQ
  main.py                 ← MODIFY: add simulation endpoints

frontend/
  src/components/
    ScenarioSimulator.tsx ← NEW: game UI
  src/App.tsx             ← MODIFY: simulator toggle

.vscode/
  mcp.json                ← NEW: VS Code MCP config

.env                      ← MODIFY: add Azure keys
requirements.txt          ← MODIFY: add mcp library
README.md                 ← NEW: full documentation
```

---

## 13. Backend Endpoints to Add

```python
# Existing chat endpoint — modify to use Foundry IQ
POST /api/chat

# New simulation endpoints
GET  /api/simulation/scenarios
# Returns list of all 3 scenarios with metadata

POST /api/simulation/step
# Input:  scenario_id, current_node_id, user_choice
# Process: hit Foundry IQ for relevant law chunks
#          Gemini grades choice: Legal/Risky/Illegal
#          Returns explanation + citation + score delta + next_node
# Output: { grade, explanation, citation, score, next_node }
```

---

## 14. retriever.py Changes

```python
# Current (Supabase pgvector)
# Change to Foundry IQ (Azure AI Search)

from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

def retrieve_laws(query: str, limit: int = 5):
    client = SearchClient(
        endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
        index_name=os.getenv("AZURE_SEARCH_INDEX"),
        credential=AzureKeyCredential(os.getenv("AZURE_SEARCH_KEY"))
    )
    results = client.search(
        search_text=query,
        top=limit,
        include_total_count=True
    )
    chunks = []
    for result in results:
        chunks.append({
            "content": result["content"],
            "source": result["source"],
            "score": result["@search.score"],
            "section": result.get("section", ""),
            "act": result.get("act", "")
        })
    # Confidence check
    if not chunks or chunks[0]["score"] < 0.75:
        return None  # Triggers DLSA fallback
    return chunks
```

---

## 14B. Language Detection Code

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
import os

language_client = TextAnalyticsClient(
    endpoint=os.getenv("AZURE_LANGUAGE_ENDPOINT"),
    credential=AzureKeyCredential(os.getenv("AZURE_LANGUAGE_KEY"))
)

def detect_language(text: str) -> str:
    """
    Returns language code: 'hi', 'kn', 'en', etc.
    Falls back to 'en' if detection fails.
    One free API call per user message.
    F0 tier: 5,000 free calls/month, ₹0 cost.
    """
    try:
        result = language_client.detect_language(
            documents=[{"id": "1", "text": text}]
        )
        return result[0].primary_language.iso6391_name
    except Exception:
        return "en"  # safe fallback
```

---


## 15. requirements.txt Additions

```
mcp
azure-search-documents
azure-core
azure-ai-textanalytics
```

---

## 16. README Structure (Required for Judging)

```markdown
# LexAI — Multilingual Legal Aid for Indian Citizens

## What It Does
## Microsoft IQ Integration (Foundry IQ)
## How GitHub Copilot Assisted Development
  ### Inline Suggestions Used For
  ### Copilot Chat Used For
  ### The MCP Integration (screenshot here)
## Architecture Diagram
## Simulator Scenarios
## Safety Design
## How to Run Locally
## Deployment
```

---

## 17. GitHub Copilot Strategy

```
Inline Suggestions  : ~98% remaining
→ Use freely while coding in VS Code
→ Antigravity handles heavy lifting

Copilot Chat        : ~10 messages remaining (21% of 50/month)
→ Never open during development
→ Save for demo video only
→ Dry run: 2-3 messages to test MCP works
→ Final recording: 1 message

Rule: Build everything in Antigravity.
Move to VS Code only for demo recording.
```

---

## 18. Deployment Plan

```
Frontend (React)  → Vercel
                    Push to GitHub → auto deploys
                    URL: lexai.vercel.app

Backend (FastAPI) → Render.com
                    Connect GitHub repo
                    Set env variables in dashboard
                    Auto deploys on push

Knowledge Base    → Foundry IQ (Azure AI Search F0)
                    Already set up in lexai-legal project

Database          → Supabase free tier (pgvector fallback)

Azure credit consumed : ₹0
Total hosting cost    : $0
```

---

## 19. Build Order (Do Not Change This Sequence)

Build in this exact order. MCP server must work before touching frontend.

```
Phase 1 — Foundation (Tonight June 12)
  1. Create Azure AI Search F0 resource
  2. Connect to Foundry project
  3. Upload 3 legislation PDFs (plain text, no AI enrichment)
  4. Copy endpoint + key to .env
  5. Update retriever.py to Foundry IQ
  6. Test retrieval works: python -c "from retriever import retrieve_laws; print(retrieve_laws('salary withheld'))"
  6B. Create Azure Language resource (F0)
      Copy endpoint + key to .env
      Test: python -c "from language import detect_language; print(detect_language('mujhe nahi pata kya karna hai'))"
      Should return: 'hi'

Phase 2 — MCP Server (Tonight June 12)
  7. Build mcp_server.py with search_laws() and explain_law_section()
  8. Add mcp to requirements.txt
  9. Test locally with mcp-cli
  10. Create .vscode/mcp.json config file

Phase 3 — Simulator Backend (June 13 Morning)
  11. Build scenarios.py with 3 scenario decision trees
  12. Add GET /api/simulation/scenarios to main.py
  13. Add POST /api/simulation/step to main.py
  14. Test endpoints with curl

Phase 4 — Simulator Frontend (June 13 Afternoon)
  15. Build ScenarioSimulator.tsx
  16. Add simulator toggle to App.tsx
  17. Add "Ask LexAI" hand-off button
  18. Test full game flow

Phase 5 — Polish (June 13 Evening)
  19. Integrate system prompt into chat endpoint
  20. Add confidence threshold to retriever
  21. Add DLSA fallback responses
  22. Build README with architecture diagram

Phase 6 — Deploy (June 14 Morning)
  23. Deploy frontend to Vercel
  24. Deploy backend to Render.com
  25. Full end-to-end test on deployed URLs
  26. Fix any deployment bugs

Phase 7 — Demo (June 14 Afternoon)
  27. Open VS Code with lexai project
  28. Verify .vscode/mcp.json loads correctly
  29. Dry run: ask one test question in Copilot Chat
  30. Record demo video
  31. Fill submission form
  32. Submit before 11:59 PM
```

---

## 20. What Makes This Win

One — You extended Copilot, not just used it. MCP server makes LexAI a capability inside VS Code. Judges explicitly asked for MCP server integrations.

Two — Real Foundry IQ integration. Actual legislation PDFs, actual Azure AI Search, every answer cited to a real law section. Not just mentioned in README.

Three — Genuine human impact. Legal aid for citizens who cannot afford lawyers, in their own language, grounded in real law. This story is memorable.

Four — Creative differentiator. Civic rights as a choose-your-own-adventure game grounded in RAG. Nobody else is doing this.

Five — Safety-first design. Clarifying questions, confidence thresholds, scope boundaries, DLSA fallback. Shows the team thought about failure modes.

Six — Complete product loop. Simulator teaches through play. Chat answers real questions. One feeds the other.

Seven — Two Azure services integrated.
Foundry IQ for knowledge retrieval +
Azure Language Detection for multilingual input.
Shows depth of Microsoft ecosystem usage
beyond just the minimum requirement.

---

## 21. Immediate First Task for Antigravity

Current blocker: Azure AI Search resource not created yet.

Go to Microsoft Foundry → Build → Knowledge → scroll down → click "Create new resource" → fill in Name: lexai-search, Region: East US 2, Tier: Free F0, Resource Group: rg-amishajosnadsouza.1-5992 → create → come back → select from dropdown → connect → create knowledge base → upload 3 PDFs → copy endpoint and key.

Once .env has the Azure keys, start Phase 2: mcp_server.py. -->
