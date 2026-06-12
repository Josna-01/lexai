import React, { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { Message } from './components/MessageBubble';
import { 
  Scale, Globe, BookOpen, AlertTriangle, 
  HelpCircle, ExternalLink, Layers 
} from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retrieverType, setRetrieverType] = useState<'supabase' | 'foundry'>('supabase');
  const [view, setView] = useState<'chat' | 'simulator'>('chat');

  // Load backend health check to identify active retriever on launch
  React.useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.retriever_type) {
          setRetrieverType(data.retriever_type as 'supabase' | 'foundry');
        }
      })
      .catch(err => console.warn("Could not retrieve health check details:", err));
  }, []);

  const handleSendMessage = async (
    text: string, 
    imageBase64?: string | null, 
    imageMime?: string | null
  ) => {
    // 1. Format and append user message
    const userMsg: Message = {
      role: 'user',
      content: text,
      image_base64: imageBase64,
      image_mime_type: imageMime
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Prepare request payload
      // Maps exactly to ChatRequest Pydantic schema in the backend
      const payload = {
        query: text,
        history: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        image_base64: imageBase64 || null,
        image_mime_type: imageMime || null
      };

      // 3. Post to backend chat endpoint (routed via Vite proxy to FastAPI)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server responded with an error');
      }

      const data = await response.json();
      
      // 4. Append assistant response containing retrieved citations
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations || []
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errMsg: Message = {
        role: 'assistant',
        content: `**Error**: Failed to retrieve response from LexAI backend. Ensure the FastAPI server is running at http://localhost:8000.\n\nDetails: *${error.message}*`
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleHandoffToChat = (initialQuery: string, contextDescription: string) => {
    setView('chat');
    const contextMsg: Message = {
      role: 'assistant',
      content: `**Preloaded Simulator Context**:\n${contextDescription}\n\n*Feel free to ask details about this scenario!*`
    };
    setMessages([contextMsg]);
    handleSendMessage(initialQuery);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/10">
              <Scale size={22} className="animate-pulse-subtle" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LexAI
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Microsoft Hackathon Legal Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setView('chat')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                  view === 'chat'
                    ? 'bg-primary-600 border border-primary-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Legal Aid Chat
              </button>
              <button
                onClick={() => setView('simulator')}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                  view === 'simulator'
                    ? 'bg-primary-600 border border-primary-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rights Simulator
              </button>
            </div>

            {/* Clear Chat */}
            {view === 'chat' && (
              <button
                onClick={clearChat}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors active:scale-95"
              >
                Clear Feed
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Sidebar Info Section (Span 4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-5 shrink-0">
          
          {/* Language selection card */}
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40 glass-panel shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Globe size={14} className="text-primary-400" /> Choose Query Language
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  language === 'en'
                    ? 'bg-primary-500 border-primary-400 text-white shadow-md shadow-primary-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  language === 'hi'
                    ? 'bg-primary-500 border-primary-400 text-white shadow-md shadow-primary-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  language === 'kn'
                    ? 'bg-primary-500 border-primary-400 text-white shadow-md shadow-primary-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-3.5 leading-relaxed">
              * The system will listen and read aloud in your chosen language, and map responses directly to official laws.
            </p>
          </div>

          {/* Hackathon Architecture Alert Card */}
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40 glass-panel shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Layers size={14} className="text-accent-400" /> Hackathon Stack
            </h3>
            
            <div className="space-y-3">
              {/* Primary vs Fallback Indicator */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-bold">Target Infrastructure:</span>
                  <span className="text-sky-400 font-bold uppercase flex items-center gap-0.5">
                    Microsoft Foundry IQ
                  </span>
                </div>
                
                <div className="flex justify-between text-[10px] pt-1.5 border-t border-slate-900">
                  <span className="text-slate-400 font-bold">Active Engine:</span>
                  <span className={`font-bold uppercase ${
                    retrieverType === 'foundry' ? 'text-sky-400' : 'text-amber-500'
                  }`}>
                    {retrieverType === 'foundry' ? 'Foundry IQ (Enterprise)' : 'Supabase pgvector (Local)'}
                  </span>
                </div>
              </div>

              {/* Development warning */}
              <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-500/80">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="text-[10px] leading-relaxed">
                  <span className="font-bold text-amber-400 block mb-0.5">Quota Protection</span>
                  Running local Supabase vector search fallback to conserve Azure and API model credits. Production deployments toggle automatically.
                </div>
              </div>
            </div>
          </div>

          {/* Supported Laws Card */}
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/40 glass-panel shadow-xl flex-1 hidden lg:flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <BookOpen size={14} className="text-primary-400" /> Active Legal Scope (MVP)
            </h3>
            
            <ul className="space-y-2 text-[11px] text-slate-400 flex-1 overflow-y-auto">
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-900">
                <span>Consumer Protection Act, 2019</span>
                <span className="text-[9px] bg-slate-900 px-1 rounded text-primary-400 font-mono">In Database</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-900">
                <span>Payment of Wages Act, 1936</span>
                <span className="text-[9px] bg-slate-900 px-1 rounded text-primary-400 font-mono">In Database</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-900">
                <span>Right to Information Act, 2005</span>
                <span className="text-[9px] bg-slate-900 px-1 rounded text-primary-400 font-mono">In Database</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-900">
                <span>BNS (Assault & Harassment)</span>
                <span className="text-[9px] bg-slate-900 px-1 rounded text-primary-400 font-mono">In Database</span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><HelpCircle size={10} /> Powered by Copilot</span>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:underline flex items-center gap-0.5 text-primary-400"
              >
                Repo <ExternalLink size={8} />
              </a>
            </div>
          </div>

        </section>

        {/* Main Panel (Span 8 cols) */}
        <section className="lg:col-span-8 flex flex-col h-[550px] sm:h-[620px] lg:h-full min-h-0">
          {view === 'chat' ? (
            <ChatWindow 
              messages={messages} 
              isLoading={isLoading} 
              language={language}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <ScenarioSimulator onHandoffToChat={handleHandoffToChat} />
          )}
        </section>

      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 py-3 bg-slate-950 text-center shrink-0">
        <p className="text-[10px] text-slate-600 font-medium">
          LexAI © 2026. Made with GitHub Copilot & Microsoft Azure for the Legal Aid Hackathon.
        </p>
      </footer>

    </div>
  );
};

export default App;
