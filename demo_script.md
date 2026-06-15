# ⚖️ LexAI — 3-Minute Video Demo Script

This script is structured to keep your video presentation under the **3-minute limit** while showcasing all core features of LexAI.

---

## ⏱️ Timeline Overview

| Section | Duration | Screen / Feature to Show |
| :--- | :--- | :--- |
| **Part 1: Intro** | 0:00 – 0:30 (30s) | Branded Landing Page (scroll slowly) |
| **Part 2: Chat Mode** | 0:30 – 1:15 (45s) | Multilingual Legal Aid Chat Assistant |
| **Part 3: Simulator** | 1:15 – 2:00 (45s) | Pre-curated Scenario + Custom AI Generator |
| **Part 4: MCP Server** | 2:00 – 2:45 (45s) | VS Code + GitHub Copilot Chat |
| **Part 5: Conclusion** | 2:45 – 3:00 (15s) | Web Landing Page / Branded Footer |

---

## 🎙️ Narrative Script

### Part 1: Intro & Problem Statement (0:00 – 0:30)
* **What to DO on-screen**: Start on the LexAI home/landing page. Scroll down slowly to show the glassmorphic layout, glowing cards, and modern typography.
* **What to SAY**:
  > *"Hello everyone! Millions of citizens in India lose wages, refunds, and fundamental rights — not because the law doesn't protect them, but because they cannot understand complex legal language. LexAI is a multilingual legal aid platform built to bridge this gap for over 800 million unrepresented Indian citizens by making the law accessible, interactive, and developer-integrated. Let's see it in action."*

---

### Part 2: Legal Aid Chat Assistant (0:30 – 1:15)
* **What to DO on-screen**:
  1. Navigate to the Chat window.
  2. Click the **Mic/Speaker icon** and speak in English:
     `"My employer has delayed my salary for two months."`
  3. Send the query and show the retrieved English response with citation.
  4. Now, enter the same query in Hindi script:
     `"मेरे नियोक्ता ने दो महीने से मेरा वेतन नहीं दिया है।"`
  5. Send the query and show the response in Hindi.
  6. Send a follow-up cross-question in Hinglish:
     `"Kya mai iske khilaf complaint file kar sakta hu?"`
  7. Show the context-aware Hindi response.
* **What to SAY**:
  > *"Our Legal Aid Chat is fully voice-enabled and multilingual. First, we speak our query in English. The speech-to-text converts it instantly, and LexAI retrieves the relevant Wage acts. Next, we can submit the exact same query in Hindi script — notice how LexAI detects the Hindi language and returns the response in Hindi. Finally, we ask a cross-question in Hinglish, 'Kya mai iske khilaf complaint file kar sakta hu?' — showing how the system remembers conversational context and responds intelligently in Hindi."*

---

### Part 3: Interactive Legal Rights Simulator (1:15 – 2:00)
* **What to DO on-screen**:
  1. Navigate to the **"Simulator"** page from the sidebar.
  2. Click on **"Wage Rights"** under the curated categories list.
  3. Click one choice on Stage 1 (e.g. choice A) to show the grade pop-up (Correct/Risky/Illegal) and the dynamic legal explanation.
  4. Click the **"Custom AI Scenario"** tab.
  5. Type: `"I bought a phone online and it was defective, but the shop refuses to refund."`
  6. Click **"Generate Scenario"** and show the generated game story.
* **What to SAY**:
  > *"Next is our Interactive Legal Rights Simulator. Here, citizens learn their rights through gamified, five-stage choose-your-own-adventure scenarios. In this curated Wage Rights scenario, every choice evaluates the user's action under Indian Law, providing a grade of Correct, Risky, or Illegal along with a simple legal explanation. If you have a specific real-world case, our custom AI generator builds a unique, legally grounded scenario on the fly so you can practice negotiating your rights safely."*

---

### Part 4: MCP Server & VS Code Integration (2:00 – 2:45)
* **What to DO on-screen**:
  1. Switch screen to your **VS Code** window.
  2. Open `.vscode/mcp.json` to show the config on screen.
  3. Open the **GitHub Copilot Chat** sidebar (or press `Ctrl+Alt+I`).
  4. Type a query in Copilot Chat:
     `"Search laws about 'Mera boss salary nahi de raha hai' using lexai-helper"`
  5. Show Copilot Chat running the tool `search_laws` and rendering the legal references from the Payment of Wages Act.
* **What to SAY**:
  > *"Finally, we wanted to bring legal intelligence directly into the developer workflow. LexAI includes a Model Context Protocol — or MCP — server. By configuring our workspace settings inside the `.vscode` folder, GitHub Copilot automatically registers our custom tools. We can query the server using natural language — even code-mixed Hinglish. When we ask Copilot about 'Mera boss salary nahi de raha', our MCP server automatically normalizes the Hinglish query to legal terms, searches our indexed legislation, and returns the grounded legal sections directly inside the IDE."*

---

### Part 5: Conclusion (2:45 – 3:00)
* **What to DO on-screen**: Switch back to the Web App Landing Page and show the footer.
* **What to SAY**:
  > *"By combining semantic search on Azure, Gemini's reasoning power, interactive gaming, and direct developer integration, LexAI empowers every Indian citizen to understand and stand up for their rights. Thank you!"*

---

## 🛠️ VS Code MCP Setup Details for Recording

To make sure your VS Code demo goes smoothly:
1. Keep the `uvicorn` backend running on port `8000` (which it currently is).
2. Open the root `lexai` folder in VS Code.
3. When you open Copilot Chat, it reads the workspace's `.vscode/mcp.json` automatically.
4. If you ask Copilot a question referencing `lexai-helper`, it runs `python backend/mcp_server.py` in the background and executes the tool for you.




My employer has delayed my salary for two months.
मेरे नियोक्ता ने दो महीने से मेरा वेतन नहीं दिया है।
Kya mai iske khilaf complaint file kar sakta hu?