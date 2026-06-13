import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { Message } from './components/MessageBubble';
import BlurText from './components/BlurText';
import DarkVeil from './components/DarkVeil';
import logo from './assets/logo.png';
import {
  Scale, Globe, BookOpen, Layers,
  Settings as SettingsIcon, X, MessageSquare, Mic, Image as ImageIcon,
  ShieldCheck, ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retrieverType, setRetrieverType] = useState<'supabase' | 'foundry'>('supabase');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Client-side URL routing state
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activeSection, setActiveSection] = useState<'landing' | 'features' | 'app'>('landing');

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lock body scroll when on chat or simulator routes
  useEffect(() => {
    if (currentPath === '/chat' || currentPath === '/simulator') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [currentPath]);

  // Scroll spy to automatically update active navbar tab on scroll (only on home page)
  useEffect(() => {
    if (currentPath !== '/') return;

    const handleScroll = () => {
      const page1 = document.getElementById('page1');
      const page2 = document.getElementById('page2');

      if (!page1 || !page2) return;

      const scrollPos = window.scrollY + 250;

      const top2 = page2.offsetTop;

      if (scrollPos >= top2) {
        setActiveSection('features');
      } else {
        setActiveSection('landing');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  // Stepper state on Page 2
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState<boolean>(false);

  // Stepper Autoplay Effect
  useEffect(() => {
    if (isAutoplayPaused) return;

    const interval = setInterval(() => {
      setActiveStep(prev => (prev === 4 ? 1 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoplayPaused]);

  // Clean up autoplay timer
  useEffect(() => {
    return () => {
      if ((window as any)._stepperResumeTimeout) {
        clearTimeout((window as any)._stepperResumeTimeout);
      }
    };
  }, []);

  const handleStepClick = (stepNum: number) => {
    setActiveStep(stepNum);
    setIsAutoplayPaused(true);
    
    if ((window as any)._stepperResumeTimeout) {
      clearTimeout((window as any)._stepperResumeTimeout);
    }
    
    (window as any)._stepperResumeTimeout = setTimeout(() => {
      setIsAutoplayPaused(false);
    }, 10000);
  };

  // Settings values
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  // Load backend health check to identify active retriever on launch
  useEffect(() => {
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
      const payload = {
        query: text,
        history: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        image_base64: imageBase64 || null,
        image_mime_type: imageMime || null
      };

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
    navigateTo('/chat');
    const contextMsg: Message = {
      role: 'assistant',
      content: `**Preloaded Simulator Context**:\n${contextDescription}\n\n*Feel free to ask details about this scenario!*`
    };
    setMessages([contextMsg]);
    handleSendMessage(initialQuery);
  };

  // Scroll to section helper
  const scrollToSection = (sectionId: string, sectionName: 'landing' | 'features' | 'app') => {
    setActiveSection(sectionName);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans overflow-x-hidden bg-[#050816]">

      {/* Global Background DarkVeil (Persistent Canvas) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Fixed Sticky Top Navbar (Global) */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav px-10 py-2.5 grid grid-cols-3 items-center shrink-0">
        
        {/* Left Zone - Logo */}
        <div className="flex justify-start">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src={logo} alt="LexAI Logo" className="h-9 w-auto object-contain" />
          </button>
        </div>

        {/* Center Zone - Navigation Links */}
        <nav className="flex justify-center gap-10 text-sm font-semibold text-slate-400">
          <button
            onClick={() => scrollToSection('page2', 'features')}
            className={`relative pb-1.5 hover:text-white transition-all duration-300 cursor-pointer ${currentPath === '/' && activeSection === 'features' ? 'text-[#a855f7] font-semibold' : ''}`}
          >
            About
            {currentPath === '/' && activeSection === 'features' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#a855f7] rounded-full shadow-[0_0_8px_#a855f7] animate-fade-in-up"></span>
            )}
          </button>
          <button
            onClick={() => navigateTo('/chat')}
            className={`relative pb-1.5 hover:text-white transition-all duration-300 cursor-pointer ${currentPath === '/chat' ? 'text-[#a855f7] font-semibold' : ''}`}
          >
            Legal Chat
            {currentPath === '/chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#a855f7] rounded-full shadow-[0_0_8px_#a855f7] animate-fade-in-up"></span>
            )}
          </button>
          <button
            onClick={() => navigateTo('/simulator')}
            className={`relative pb-1.5 hover:text-white transition-all duration-300 cursor-pointer ${currentPath === '/simulator' ? 'text-[#a855f7] font-semibold' : ''}`}
          >
            Rights Simulator
            {currentPath === '/simulator' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#a855f7] rounded-full shadow-[0_0_8px_#a855f7] animate-fade-in-up"></span>
            )}
          </button>
        </nav>

        {/* Right Zone - Settings Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-[#0b1120]/60 border border-white/8 text-slate-200 hover:text-white hover:border-[#a855f7]/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all cursor-pointer shadow-md active:scale-95"
          >
            <SettingsIcon size={15} /> Settings
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* HOME PAGE ROUTE (PAGE 1 & PAGE 2)                        */}
      {/* ======================================================== */}
      {currentPath === '/' && (
        <>
          {/* PAGE 1 — HERO LANDING (100vh) */}
          <section
            id="page1"
            className="relative h-screen flex flex-col justify-center items-center z-10 px-6 bg-[#050816]/5 pb-[7vh] transition-all duration-700"
          >
            {/* Hero Central Text */}
            <div className="flex flex-col items-center text-center max-w-4xl px-4">
              <BlurText
                text="Welcome to LexAI"
                delay={150}
                animateBy="words"
                direction="top"
                className="text-4xl sm:text-6xl font-semibold tracking-tight text-white font-display mb-8"
              />

              <BlurText
                text="Know Your Rights. In Your Language."
                delay={200}
                animateBy="words"
                direction="bottom"
                className="text-2xl sm:text-4xl font-medium text-white/95 font-display mb-5"
                highlightWords={['Rights', 'Language']}
                highlightClass="text-[#a855f7] font-semibold"
              />

              <p className="text-sm sm:text-base text-[#94A3B8] max-w-[620px] leading-relaxed mx-auto mb-10 animate-fade-up delay-300">
                Free, verified legal guidance for every Indian citizen - grounded in official legislation, delivered with dynamic multilingual AI support.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap gap-5 justify-center animate-fade-up delay-500">
                <button
                  onClick={() => navigateTo('/chat')}
                  className="px-8 py-3.5 rounded-full text-sm font-semibold bg-[#a855f7] border border-[#c084fc]/30 text-white shadow-[0_4px_14px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  Start Legal Aid Chat
                </button>
                <button
                  onClick={() => navigateTo('/simulator')}
                  className="px-8 py-3.5 rounded-full text-sm font-semibold bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  Try Rights Simulator
                </button>
              </div>
            </div>
          </section>

          {/* PAGE 2 — HOW IT WORKS */}
          <section
            id="page2"
            className="relative min-h-screen flex flex-col justify-center items-center z-10 px-6 pt-16 pb-16 bg-transparent border-t border-white/5 transition-all duration-700"
          >
            <div className="max-w-5xl w-full mx-auto space-y-12">

              <div className="text-center space-y-3">
                <span className="text-xs tracking-widest font-black uppercase text-[#c084fc] glow-text-gold">Interactive Stepper</span>
                <h2 className="text-4xl font-black uppercase tracking-tight text-white font-display">How LexAI Empowers You</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                {/* Left Column - Stepper Line (Span 5) */}
                <div className="lg:col-span-5 flex flex-row lg:flex-col justify-between lg:justify-start gap-6 lg:gap-10 relative pl-5">
                  {/* Vertical line behind the steps on desktop */}
                  <div className="hidden lg:block absolute left-[22px] top-6 bottom-6 w-0.5 bg-white/5 z-0">
                    <div 
                      className="w-full bg-[#a855f7] shadow-[0_0_10px_#a855f7] transition-all duration-700 ease-in-out animate-pulse"
                      style={{
                        height: `${((activeStep - 1) / 3) * 100}%`,
                        maxHeight: '100%'
                      }}
                    />
                  </div>

                  {/* Stepper Node 1 */}
                  <button
                    onClick={() => handleStepClick(1)}
                    className="flex items-center gap-5 text-left group cursor-pointer transition-all z-10 relative"
                  >
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all shrink-0 ${activeStep >= 1 ? 'bg-[#a855f7] border-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-100' : 'bg-slate-900 border-slate-700 text-slate-400 opacity-40 group-hover:opacity-75'}`}>
                      1
                    </div>
                    <div className={`hidden lg:block transition-all ${activeStep === 1 ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                      <h4 className="text-sm font-bold uppercase text-white tracking-wide">Choose Language</h4>
                      <p className="text-xs text-slate-400 mt-0.5">English, हिन्दी, or ಕನ್ನಡ</p>
                    </div>
                  </button>

                  {/* Stepper Node 2 */}
                  <button
                    onClick={() => handleStepClick(2)}
                    className="flex items-center gap-5 text-left group cursor-pointer transition-all z-10 relative"
                  >
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all shrink-0 ${activeStep >= 2 ? 'bg-[#a855f7] border-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-100' : 'bg-slate-900 border-slate-700 text-slate-400 opacity-40 group-hover:opacity-75'}`}>
                      2
                    </div>
                    <div className={`hidden lg:block transition-all ${activeStep === 2 ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                      <h4 className="text-sm font-bold uppercase text-white tracking-wide">Select Mode</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Legal Chat or Rights Simulator</p>
                    </div>
                  </button>

                  {/* Stepper Node 3 */}
                  <button
                    onClick={() => handleStepClick(3)}
                    className="flex items-center gap-5 text-left group cursor-pointer transition-all z-10 relative"
                  >
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all shrink-0 ${activeStep >= 3 ? 'bg-[#a855f7] border-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-100' : 'bg-slate-900 border-slate-700 text-slate-400 opacity-40 group-hover:opacity-75'}`}>
                      3
                    </div>
                    <div className={`hidden lg:block transition-all ${activeStep === 3 ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                      <h4 className="text-sm font-bold uppercase text-white tracking-wide">Describe Problem</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Type, speak, or upload photo</p>
                    </div>
                  </button>

                  {/* Stepper Node 4 */}
                  <button
                    onClick={() => handleStepClick(4)}
                    className="flex items-center gap-5 text-left group cursor-pointer transition-all z-10 relative"
                  >
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all shrink-0 ${activeStep >= 4 ? 'bg-[#a855f7] border-[#c084fc] text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-100' : 'bg-slate-900 border-slate-700 text-slate-400 opacity-40 group-hover:opacity-75'}`}>
                      4
                    </div>
                    <div className={`hidden lg:block transition-all ${activeStep === 4 ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                      <h4 className="text-sm font-bold uppercase text-white tracking-wide">Verified Legal Guidance</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Receive grounded sections & acts</p>
                    </div>
                  </button>
                </div>

                {/* Right Column - Interactive Preview Card (Span 7) */}
                <div className="lg:col-span-7 p-8 rounded-2xl bg-[#0b1120]/55 border border-white/8 backdrop-blur-2xl shadow-2xl min-h-[320px] flex flex-col justify-center">
                  <div>
                    {activeStep === 1 && (
                      <div className="space-y-5 animate-fade-up">
                        <div className="flex items-center gap-3 text-[#c084fc]">
                          <Globe size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">Step 1 — Localized Integration</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Select your preferred language. LexAI converts complex legislation details natively, allowing query input in regional scripts.
                        </p>
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => setLanguage('en')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                              language === 'en'
                                ? 'bg-[#a855f7]/30 border-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-[#0b1120]/60 border-white/10 text-slate-300 hover:border-white/25'
                            }`}
                          >
                            English
                          </button>
                          <button
                            onClick={() => setLanguage('hi')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                              language === 'hi'
                                ? 'bg-[#a855f7]/30 border-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-[#0b1120]/60 border-white/10 text-slate-300 hover:border-white/25'
                            }`}
                          >
                            हिन्दी
                          </button>
                          <button
                            onClick={() => setLanguage('kn')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                              language === 'kn'
                                ? 'bg-[#a855f7]/30 border-[#a855f7] text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-[#0b1120]/60 border-white/10 text-slate-300 hover:border-white/25'
                            }`}
                          >
                            ಕನ್ನಡ
                          </button>
                        </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div className="space-y-5 animate-fade-up">
                        <div className="flex items-center gap-3 text-[#c084fc]">
                          <Layers size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">Step 2 — Mode Selection</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Choose how you want to interact: Chat freely with our legal assistant, or play an interactive Rights Simulator scenario to test your civic knowledge.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
                            <MessageSquare size={20} className="text-[#a855f7] mb-2" />
                            <h5 className="text-sm font-bold text-white mb-1">Legal Chat</h5>
                            <p className="text-xs text-slate-500">Freeform queries</p>
                          </div>
                          <div className="p-5 rounded-xl bg-slate-950/60 border border-[#c084fc]/30 text-left">
                            <Scale size={20} className="text-[#c084fc] mb-2" />
                            <h5 className="text-sm font-bold text-white mb-1">Simulator</h5>
                            <p className="text-xs text-slate-500">Play & Learn rights</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 3 && (
                      <div className="space-y-5 animate-fade-up">
                        <div className="flex items-center gap-3 text-[#c084fc]">
                          <Mic size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">Step 3 — Problem Input</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          LexAI supports flexible multimodal inputs. Type your query, speak to dictate, or upload receipts/notices directly.
                        </p>
                        <div className="flex gap-6 pt-1 text-slate-400 text-sm">
                          <span className="flex items-center gap-2"><MessageSquare size={16} className="text-[#a855f7]" /> Type</span>
                          <span className="flex items-center gap-2"><Mic size={16} className="text-purple-400" /> Speak</span>
                          <span className="flex items-center gap-2"><ImageIcon size={16} className="text-purple-300" /> Photo</span>
                        </div>
                      </div>
                    )}

                    {activeStep === 4 && (
                      <div className="space-y-5 animate-fade-up">
                        <div className="flex items-center gap-3 text-[#c084fc]">
                          <BookOpen size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">Step 4 — Verified Legal Guidance</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-mono">
                          "Under Section 15 of the Payment of Wages Act, 1936, the employee has a right to file a claim for unpaid wages..."
                        </p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#8b5cf6]/10 text-[#c084fc] border border-[#8b5cf6]/25">
                            <ShieldCheck size={14} /> Payment of Wages Act 1936 ✓
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </section>


          {/* PAGE 3 — GET STARTED CTA (standalone, centered, full screen) */}
          <section
            id="page3-cta"
            className="relative min-h-screen flex flex-col justify-center items-center z-10 px-6 py-20 bg-transparent border-t border-white/5 transition-all duration-700"
          >
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-10">

              {/* Section heading — centered */}
              <div className="text-center space-y-2">
                <span className="text-[10px] tracking-widest font-black uppercase text-[#c084fc]">Get Started</span>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white font-display">Choose Your Experience</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Two powerful tools to help every Indian citizen understand and exercise their legal rights.
                </p>
              </div>

              {/* 4 Feature Cards — full-width grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                <div className="p-6 rounded-2xl glass-card-premium space-y-3">
                  <Globe size={22} className="text-[#c084fc]" />
                  <h5 className="text-sm font-bold text-white">Multilingual</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">English, Hindi, and Kannada natively supported.</p>
                </div>
                <div className="p-6 rounded-2xl glass-card-premium space-y-3">
                  <BookOpen size={22} className="text-[#c084fc]" />
                  <h5 className="text-sm font-bold text-white">Verified Laws</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Replies citation-linked to actual acts and sections.</p>
                </div>
                <div className="p-6 rounded-2xl glass-card-premium space-y-3">
                  <Layers size={22} className="text-purple-400" />
                  <h5 className="text-sm font-bold text-white">Foundry IQ</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Smart cloud-based legal retrieval system.</p>
                </div>
                <div className="p-6 rounded-2xl glass-card-premium space-y-3">
                  <Scale size={22} className="text-[#c084fc]" />
                  <h5 className="text-sm font-bold text-white">Simulator</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">Learn rights by simulating actual legal cases.</p>
                </div>
              </div>

              {/* Two CTA Cards — equal width, full spread */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <button
                  onClick={() => navigateTo('/chat')}
                  className="p-8 rounded-2xl border border-[#a855f7]/30 bg-[#a855f7]/5 hover:bg-[#a855f7]/10 hover:border-[#a855f7]/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all flex flex-col justify-between text-left group cursor-pointer shadow-lg active:scale-95 min-h-[240px]"
                >
                  <div className="space-y-4">
                    <div className="w-13 h-13 w-14 h-14 rounded-xl bg-slate-950 border border-[#a855f7]/25 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                      <MessageSquare size={26} className="text-[#a855f7]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-[#c084fc] transition-colors font-display">Go to Legal Chat</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wide">AI-Powered Assistant</p>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Chat freely with our intelligent legal assistant. Ask queries, upload document photos, or dictate questions natively in English, Hindi, or Kannada.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#c084fc] mt-8 group-hover:translate-x-1.5 transition-transform">
                    Start Chatting <ArrowRight size={16} />
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('/simulator')}
                  className="p-8 rounded-2xl border border-[#c084fc]/25 bg-white/[0.03] hover:bg-[#c084fc]/5 hover:border-[#c084fc]/55 hover:shadow-[0_0_40px_rgba(192,132,252,0.18)] transition-all flex flex-col justify-between text-left group cursor-pointer shadow-lg active:scale-95 min-h-[240px]"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-[#c084fc]/25 flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.12)]">
                      <Scale size={26} className="text-[#c084fc]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-[#c084fc] transition-colors font-display">Go to Rights Simulator</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wide">Interactive Legal Learning Game</p>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Test your legal awareness with realistic scenarios on wages, consumer rights, and harassment. Learn your rights through interactive game-like choices.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#c084fc] mt-8 group-hover:translate-x-1.5 transition-transform">
                    Launch Simulator <ArrowRight size={16} />
                  </div>
                </button>
              </div>

            </div>
          </section>
        </>
      )}


      {/* ======================================================== */}
      {/* PAGE 3 — CHAT & SIMULATOR PAGE ROUTES                    */}
      {/* ======================================================== */}
      {(currentPath === '/chat' || currentPath === '/simulator') && (
        <section
          id="page3"
          className="relative h-screen flex flex-col justify-between z-10 transition-all duration-700 pt-20 bg-[#050816]/40 backdrop-blur-xl"
        >
          {/* Content area: scrolls independently */}
          <div className="flex-1 min-h-0 flex flex-col relative w-full pt-4">
            {currentPath === '/chat' ? (
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                language={language}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <ScenarioSimulator onHandoffToChat={handleHandoffToChat} />
            )}
          </div>

          {/* Brand footer */}
          <footer className="py-2.5 bg-[#050816]/90 border-t border-white/5 text-center shrink-0">
            <p className="text-[10px] text-slate-600 font-medium">
              LexAI © 2026. Powered by Microsoft Foundry IQ & Supabase Fallback.
            </p>
          </footer>
        </section>
      )}

      {/* ======================================================== */}
      {/* SETTINGS DRAWER (Slide-over)                             */}
      {/* ======================================================== */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setSettingsOpen(false)}
          ></div>

          {/* Drawer content panel */}
          <div className="relative w-80 max-w-full h-full bg-[#050816]/95 border-l border-white/8 backdrop-blur-2xl p-6 flex flex-col justify-between shadow-2xl z-10 animate-fade-up">

            <div className="space-y-6">
              {/* Drawer header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2 text-[#c084fc]">
                  <SettingsIcon size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Settings</h3>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Language selection card inside drawer */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Query Language</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${language === 'en'
                      ? 'bg-[#a855f7] border-[#c084fc] text-white font-black shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('hi')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${language === 'hi'
                      ? 'bg-[#a855f7] border-[#c084fc] text-white font-black shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => setLanguage('kn')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${language === 'kn'
                      ? 'bg-[#a855f7] border-[#c084fc] text-white font-black shadow-md'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              {/* Voice controls */}
              <div className="space-y-2.5 pt-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Voice Controls</label>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Read assistant replies aloud</span>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-10 h-6 rounded-full p-1 transition-all flex items-center ${voiceEnabled ? 'bg-[#a855f7] justify-end' : 'bg-slate-950 border border-slate-800 justify-start'}`}
                  >
                    <span className={`w-4 h-4 rounded-full ${voiceEnabled ? 'bg-slate-950' : 'bg-slate-600'}`}></span>
                  </button>
                </div>
              </div>

              {/* Legal database scope */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Indexed Database Scope</label>
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 text-[10px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Consumer Protection Act</span>
                    <span className="text-[#a855f7] font-bold">Loaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment of Wages Act</span>
                    <span className="text-[#a855f7] font-bold">Loaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RTI Act, 2005</span>
                    <span className="text-[#a855f7] font-bold">Loaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BNS (Assault & Harassment)</span>
                    <span className="text-[#a855f7] font-bold">Loaded</span>
                  </div>
                </div>
              </div>

              {/* Retriever mode */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Active Retriever Engine</label>
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>Engine:</span>
                  <span className="font-mono font-bold uppercase text-[#a855f7]">
                    {retrieverType === 'foundry' ? 'Foundry IQ (Cloud)' : 'Supabase (Local)'}
                  </span>
                </div>
              </div>

              {/* Privacy mode */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Security & Privacy</label>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-xs text-slate-300">Privacy Mode (Do not save history)</span>
                  <button
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className={`w-10 h-6 rounded-full p-1 transition-all flex items-center ${privacyMode ? 'bg-[#a855f7] justify-end' : 'bg-slate-950 border border-slate-800 justify-start'}`}
                  >
                    <span className={`w-4 h-4 rounded-full ${privacyMode ? 'bg-slate-950' : 'bg-slate-600'}`}></span>
                  </button>
                </div>
              </div>

            </div>

            {/* Clear feed at the bottom */}
            <div className="space-y-2.5 pt-6 border-t border-white/5">
              <button
                onClick={() => {
                  clearChat();
                  setSettingsOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:scale-95 transition-all cursor-pointer text-center"
              >
                Clear Conversation Feed
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;

