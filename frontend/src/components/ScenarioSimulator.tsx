import React, { useState } from 'react';
import { API_BASE } from '../api';
import {
  Factory, Laptop, ShieldAlert, Scale,
  ArrowRight, Trophy, HelpCircle, Sparkles,
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, MessageSquare, RefreshCw, BookOpen, ChevronLeft
} from 'lucide-react';
import { Citation, CitationTag } from './CitationTag';

interface Scenario {
  id: number | string;
  title: string;
  act: string;
  character: string;
  description: string;
  icon: string;
  start_node: string;
  isCustom?: boolean;
  isCategory?: boolean;
  nodes?: any;
}

interface StepResponse {
  grade: 'correct' | 'risky' | 'illegal' | 'legal';
  explanation: string;
  citation: string;
  score_delta: number;
  next_node: string;
}

interface ChoiceMade {
  step: string;
  choice: string;
  score: number;
  grade: string;
  explanation?: string;
}

interface QAItem {
  question: string;
  answer: string;
  citations: Citation[];
}

const FormattedExplanation: React.FC<{ text: string }> = ({ text }) => {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);

  return (
    <div className="space-y-[24px] text-xs leading-[1.8] pt-2">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Citation Badge
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const citationText = trimmed.slice(1, -1).trim();
          return (
            <div key={idx} className="-mt-3 mb-[24px]">
              <span className="bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#c084fc] px-2.5 py-1 rounded-md font-mono text-[10px] font-bold">
                {citationText}
              </span>
            </div>
          );
        }

        // Numbered Reason Card
        const numberedReasonMatch = trimmed.match(/^(\d+)\.\s+([^\n]+)(?:\n([\s\S]*))?/);
        if (numberedReasonMatch) {
          const number = numberedReasonMatch[1];
          const heading = numberedReasonMatch[2];
          const explanation = numberedReasonMatch[3];

          return (
            <div key={idx} className="p-4 rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/5 shadow-[0_4px_15px_rgba(168,85,247,0.05)] space-y-2 mb-[24px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h5 className="font-bold text-white flex items-center gap-2.5 relative z-10">
                <span className="w-5 h-5 rounded-full bg-[#a855f7]/20 flex items-center justify-center text-[10px] text-[#c084fc] font-bold shadow-[0_0_8px_rgba(168,85,247,0.2)]">{number}</span>
                {heading.replace(/\*/g, '')}
              </h5>
              {explanation && <p className="text-slate-300 leading-[1.8] relative z-10 mt-[8px]">{explanation.replace(/\*/g, '')}</p>}
            </div>
          );
        }

        // Special Sections (Short Answer, Practical Tip)
        const lines = trimmed.split('\n');
        const firstLineLower = lines[0].toLowerCase();

        if (firstLineLower.includes('short answer') || firstLineLower.includes('practical tip')) {
          let header = lines[0].replace(/:$/, '');
          let body = lines.slice(1).join('\n');

          if (!body && lines[0].includes(':')) {
            const parts = lines[0].split(':');
            header = parts[0];
            body = parts.slice(1).join(':').trim();
          }

          return (
            <div key={idx} className="space-y-1.5 mb-[24px]">
              <span className="font-bold text-[#c084fc] uppercase tracking-widest text-[10px]">{header.replace(/\*/g, '')}</span>
              {body && <p className="text-slate-200 font-medium leading-[1.8] mt-[12px]">{body.replace(/\*/g, '')}</p>}
            </div>
          );
        }

        // Default Paragraph
        return (
          <p key={idx} className="text-slate-300 leading-[1.8] mb-[12px]">
            {trimmed.replace(/\*/g, '')}
          </p>
        );
      })}
    </div>
  );
};

interface ScenarioSimulatorProps {
  onHandoffToChat: (initialQuery: string, contextDescription: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onHandoffToChat }) => {
  // Simulator Modes: 'none' (mode selector), 'category' (category selector), 'custom' (free-form generation)
  const [simulatorMode, setSimulatorMode] = useState<'none' | 'category' | 'custom'>('none');

  // Scenarios state
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('1');

  // Game state
  const [gameState, setGameState] = useState<'select' | 'playing' | 'grading' | 'end'>('select');
  const [score, setScore] = useState<number>(0);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [stepResult, setStepResult] = useState<StepResponse | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Custom scenario state
  const [customSituationText, setCustomSituationText] = useState<string>('');
  const [customLanguage, setCustomLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [generatingCustom, setGeneratingCustom] = useState<boolean>(false);

  // Current step Q&A state
  const [qaInputText, setQaInputText] = useState<string>('');
  const [stepQAs, setStepQAs] = useState<QAItem[]>([]);
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [hasAskedQuestionThisStep, setHasAskedQuestionThisStep] = useState<boolean>(false);

  // Cumulative game stats
  const [citedLaws, setCitedLaws] = useState<Citation[]>([]);
  const [choicesMade, setChoicesMade] = useState<ChoiceMade[]>([]);
  const [qaBonusCount, setQaBonusCount] = useState<number>(0);

  // Categories metadata
  const categoriesList = [
    { name: "Wage Rights", icon: "Factory", desc: "Delayed salaries, illegal deductions, and minimum wage disputes." },
    { name: "Consumer Refunds", icon: "Laptop", desc: "Defective goods, e-commerce scams, and refund failures." },
    { name: "Cybercrime", icon: "ShieldAlert", desc: "UPI phishing, identity theft, and online harassment." },
    { name: "Tenant Rights", icon: "BookOpen", desc: "Arbitrary eviction, withheld deposits, and lease disputes." },
    { name: "Women Safety", icon: "Scale", desc: "Workplace harassment, stalking, and domestic protection." },
    { name: "Police Rights", icon: "HelpCircle", desc: "Illegal detention, FIR filing refusals, and civic rights." }
  ];

  const getCategoryIcon = (iconName: string) => {
    const iconClass = "text-[#a855f7]";
    if (iconName === 'Factory') return <Factory size={22} className={iconClass} />;
    if (iconName === 'Laptop') return <Laptop size={22} className={iconClass} />;
    if (iconName === 'ShieldAlert') return <ShieldAlert size={22} className={iconClass} />;
    if (iconName === 'Scale') return <Scale size={22} className={iconClass} />;
    if (iconName === 'BookOpen') return <BookOpen size={22} className={iconClass} />;
    return <HelpCircle size={22} className={iconClass} />;
  };

  const getActiveNode = () => {
    if (!selectedScenario) return null;
    return selectedScenario.nodes?.[currentNodeId] || null;
  };

  const startScenario = (sc: Scenario) => {
    setSelectedScenario(sc);
    setCurrentNodeId(sc.start_node);
    setScore(0);
    setChosenOption(null);
    setStepResult(null);
    setStepQAs([]);
    setHasAskedQuestionThisStep(false);
    setCitedLaws([]);
    setChoicesMade([]);
    setQaBonusCount(0);
    setGameState('playing');
  };

  const handleSelectCategory = async (categoryName: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/category-scenario?category=${encodeURIComponent(categoryName)}`);
      if (!response.ok) {
        throw new Error("Failed to load category scenario");
      }
      const data = await response.json();
      const catScenario: Scenario = {
        id: data.id,
        title: data.title,
        act: data.act,
        character: data.character,
        description: data.nodes["1"].story,
        icon: "Scale",
        start_node: "1",
        isCategory: true,
        nodes: data.nodes
      } as any;
      startScenario(catScenario);
    } catch (err) {
      console.error(err);
      alert("Error loading category scenario. Make sure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate custom AI scenario
  const handleGenerateCustomScenario = async () => {
    if (!customSituationText.trim() || generatingCustom) return;
    setGeneratingCustom(true);

    try {
      const languageInstruction = customLanguage === 'kn'
        ? "Please generate the title, character details, story stages, and choice texts entirely in Kannada language (ಕನ್ನಡ)."
        : customLanguage === 'hi'
          ? "Please generate the title, character details, story stages, and choice texts entirely in Hindi language (हिन्दी)."
          : "Please generate the title, character details, story stages, and choice texts entirely in English.";

      const response = await fetch(`${API_BASE}/api/simulation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ situation: `${customSituationText.trim()} (${languageInstruction})` })
      });

      if (!response.ok) {
        throw new Error("Failed to generate custom scenario");
      }

      const data = await response.json();
      const dynamicScenario: Scenario = {
        id: 'custom_' + Date.now(),
        title: data.title || "Your Custom Legal Journey",
        act: "Indian Legislation",
        character: data.character || "Citizen",
        description: customSituationText.trim(),
        icon: "Scale",
        start_node: "1",
        isCustom: true,
        nodes: data.nodes
      } as any;

      startScenario(dynamicScenario);
    } catch (err) {
      console.error(err);
      alert("Error generating custom scenario. Please make sure the backend is running.");
    } finally {
      setGeneratingCustom(false);
    }
  };

  const handleChoiceSelect = async (option: string) => {
    if (!selectedScenario || submitting || stepResult) return;
    setChosenOption(option);
    setSubmitting(true);

    try {
      const activeNode = getActiveNode();
      if (!activeNode) return;

      const response = await fetch(`${API_BASE}/api/simulation/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          situation: selectedScenario.isCategory ? selectedScenario.title : selectedScenario.description,
          story: activeNode.story,
          choice_key: option,
          choice_text: activeNode.choices[option]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to process simulation step");
      }

      const result: StepResponse = await response.json();

      let mappedScore = 3;
      let gradeLabel = 'risky';

      if (result.grade === 'correct' || result.grade === 'legal') {
        gradeLabel = 'correct';
        mappedScore = 10;
      } else if (result.grade === 'illegal') {
        gradeLabel = 'illegal';
        mappedScore = 0;
      } else {
        gradeLabel = 'risky';
        mappedScore = 3;
      }

      const finalResult: StepResponse = {
        ...result,
        grade: gradeLabel as any,
        score_delta: mappedScore
      };

      setStepResult(finalResult);
      setScore(prev => prev + mappedScore);
      setChoicesMade(prev => [...prev, { step: currentNodeId, choice: option, grade: gradeLabel, score: mappedScore, explanation: finalResult.explanation }]);

      if (result.citation && result.citation !== "Indian Legislation") {
        const parsedCitation: Citation = {
          act: result.citation,
          section: null,
          year: null
        };
        setCitedLaws(prev => {
          if (prev.some(c => c.act === result.citation)) return prev;
          return [...prev, parsedCitation];
        });
      }

      setGameState('grading');
    } catch (err) {
      console.error(err);
      alert("Error submitting choice. Make sure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!qaInputText.trim() || qaLoading || !selectedScenario || !stepResult) return;
    setQaLoading(true);

    const activeNode = getActiveNode();
    if (!activeNode) return;

    const situationStr = activeNode.story;
    const choiceStr = activeNode.choices[chosenOption || 'A'];
    const gradeStr = stepResult.grade.toUpperCase();
    const explanationStr = stepResult.explanation;
    const queryStr = qaInputText.trim();

    const groundingContext = `Grounding Context: We are in a Legal Simulator game stage. Scenario: "${selectedScenario.title}". Character: "${selectedScenario.character}". Current Situation: "${situationStr}". The user chose: "${choiceStr}". LexAI evaluated this action as: "${gradeStr}" with explanation: "${explanationStr}".
Please answer the user's specific follow-up question regarding this stage and their legal choices, citing the exact sections of Indian law.

FORMAT REQUIREMENTS:
Must use the exact structure below. Separate EACH section with a blank line (double newline).

Short Answer
<1-2 lines answering the question>

1. <Heading>
<Explanation>

[ <Citation> ]

2. <Heading>
<Explanation>

[ <Citation> ]

Practical Tip
<Actionable advice>

IMPORTANT RULES:
- Separate EVERY block with a blank line.
- No markdown symbols like ** or __.
- Keep reasons to max 3.
- Citations MUST be wrapped in square brackets on their own line.
- Use simple conversational language.
- Max 250-300 words total.`;

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryStr,
          history: [
            { role: 'user', content: groundingContext }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to retrieve chat response");
      }

      const data = await response.json();
      const newItem: QAItem = {
        question: queryStr,
        answer: data.answer,
        citations: data.citations || []
      };

      setStepQAs(prev => [...prev, newItem]);
      setQaInputText('');

      if (data.citations && data.citations.length > 0) {
        setCitedLaws(prev => {
          const updated = [...prev];
          data.citations.forEach((c: Citation) => {
            if (!updated.some(existing => existing.act === c.act && existing.section === c.section)) {
              updated.push(c);
            }
          });
          return updated;
        });
      }

      if (!hasAskedQuestionThisStep) {
        setScore(prev => prev + 5);
        setQaBonusCount(prev => prev + 1);
        setHasAskedQuestionThisStep(true);
      }

    } catch (err) {
      console.error(err);
      alert("Error retrieving explanation from LexAI.");
    } finally {
      setQaLoading(false);
    }
  };

  const advanceStep = () => {
    if (!stepResult || !selectedScenario) return;

    const currentNum = parseInt(currentNodeId);
    if (currentNum >= 5) {
      setGameState('end');
    } else {
      setCurrentNodeId((currentNum + 1).toString());
      setChosenOption(null);
      setStepResult(null);
      setStepQAs([]);
      setHasAskedQuestionThisStep(false);
      setGameState('playing');
    }
  };

  const getGradeColorClass = (grade: string) => {
    if (grade === 'correct') return 'bg-[#a855f7]/15 border-[#a855f7]/40 text-white';
    if (grade === 'risky') return 'bg-white/5 border-white/10 text-slate-300';
    return 'bg-[#c084fc]/10 border-[#c084fc]/20 text-[#c084fc]';
  };

  const getGradeText = (grade: string) => {
    if (grade === 'correct') return 'CORRECT / RECOMMENDED MOVE';
    if (grade === 'risky') return 'RISKY / INEFFECTIVE MOVE';
    return 'ILLEGAL / HARMFUL MOVE';
  };

  const getGradeIcon = (grade: string) => {
    if (grade === 'correct') return <CheckCircle2 className="text-[#a855f7]" size={24} />;
    if (grade === 'risky') return <AlertTriangle className="text-slate-400" size={24} />;
    return <XCircle className="text-[#c084fc]" size={24} />;
  };

  const getBadgeDetails = (finalScore: number, maxScore: number) => {
    const pct = (finalScore / maxScore) * 100;
    if (pct >= 85) {
      return { name: "Rights Champion", emoji: "🏆", desc: "Superb! You demonstrated a complete understanding of statutory protections and correct enforcement mechanisms." };
    }
    if (pct >= 60) {
      return { name: "Legal Eagle", emoji: "🦅", desc: "Good job! You understand your basic rights and successfully navigated most procedural steps." };
    }
    if (pct >= 40) {
      return { name: "Civic Learner", emoji: "📘", desc: "You have basic awareness of legal options but fell into procedural traps. Keep learning!" };
    }
    return { name: "Just Starting", emoji: "🌱", desc: "You learned what NOT to do. Protecting yourself legally requires appealing to proper authorities." };
  };

  const activeNode = getActiveNode();
  const stages = ["Discovery", "Complication", "Escalation", "Legal Action", "Resolution"];
  const currentStageIndex = parseInt(currentNodeId) - 1;
  const maxPossibleScore = 75;

  const generateLegalTakeaways = (choices: ChoiceMade[], scenario: Scenario | null): string[] => {
    let allSentences: string[] = [];
    choices.forEach(c => {
      if (!c.explanation) return;
      let clean = c.explanation.replace(/\*/g, '').replace(/\[.*?\]/g, '').trim();
      if (clean.includes("Your choice might have unexpected consequences.")) {
        clean = clean.replace("Your choice might have unexpected consequences.", "").trim();
      }
      const sentences = clean.split(/(?<=[.!?])\s+/);
      sentences.forEach(s => {
        const trimmed = s.trim();
        if (trimmed.length > 20) {
          allSentences.push(trimmed);
        }
      });
    });

    const genericPhrases = ['this stage tested', 'you chose', 'the correct choice', 'in this scenario', 'unexpected consequences'];
    allSentences = allSentences.filter(s => !genericPhrases.some(p => s.toLowerCase().includes(p)));

    const uniqueSentences: string[] = [];
    allSentences.forEach(s => {
      const isDuplicate = uniqueSentences.some(us => {
        const words1 = s.toLowerCase().split(' ').filter(w => w.length > 4);
        const words2 = us.toLowerCase().split(' ').filter(w => w.length > 4);
        const overlap = words1.filter(w => words2.includes(w)).length;
        return overlap >= 3;
      });
      if (!isDuplicate) {
        uniqueSentences.push(s);
      }
    });

    let takeaways = uniqueSentences.slice(0, 5);

    if (takeaways.length < 5) {
      const isWage = scenario?.title?.toLowerCase().includes('wage') || scenario?.title?.toLowerCase().includes('salary');
      const isRefund = scenario?.title?.toLowerCase().includes('refund') || scenario?.title?.toLowerCase().includes('product');

      let fallbacks = [
        "Proper documentation and evidence strongly improve legal success.",
        "Formal escalation to authorities is more effective than informal disputes.",
        "Acting promptly is critical, as legal delays can weaken your case.",
        "Consumer and labor commissions provide formal avenues for redressal.",
        "Procedural correctness is essential when making legal claims."
      ];

      if (isRefund) {
        fallbacks = [
          "Product evidence such as photos or videos strengthens refund claims.",
          "Consumer Commissions can order refunds, replacements, or compensation.",
          "Bills and invoices serve as critical legal proof.",
          "Delaying escalation weakens consumer bargaining power.",
          "Formal legal channels are more effective than emotional confrontation."
        ];
      } else if (isWage) {
        fallbacks = [
          "Employers cannot arbitrarily delay wages under labor law.",
          "Written salary records strengthen unpaid wage claims.",
          "Delayed complaints may risk limitation issues.",
          "Labour authorities can order recovery and compensation.",
          "Formal escalation improves chances of recovery."
        ];
      }

      for (const def of fallbacks) {
        if (takeaways.length >= 5) break;
        if (!takeaways.some(t => t === def)) {
          takeaways.push(def);
        }
      }
    }

    return takeaways;
  };

  const sampleQueries = [
    "Why is this option better?",
    "What if the other party threatens me?",
    "What if the police refuse my complaint?"
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 relative w-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#a855f7]/20 scrollbar-track-transparent">
        <div className="w-full mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6">

          {/* ================= SCREEN 1: SELECTION SCREEN ================= */}
          {gameState === 'select' && (
            <div className="space-y-8 animate-fade-up max-w-3xl mx-auto w-full">

              {/* Header Title */}
              <div className="text-center max-w-lg mx-auto space-y-2">
                <h3 className="text-2xl font-black text-white font-display tracking-tight uppercase">Rights Simulator</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Learn your legal protections dynamically. Play predefined category scenarios or generate a custom simulator using AI.
                </p>
              </div>

              {/* Mode selection screen */}
              {simulatorMode === 'none' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Category Simulator Option */}
                  <button
                    onClick={() => setSimulatorMode('category')}
                    className="p-6 rounded-2xl border border-white/8 bg-slate-900/35 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 hover:shadow-[0_10px_30px_rgba(168,85,247,0.05)] transition-all flex flex-col items-center text-center space-y-4 shadow-lg group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={28} className="text-[#a855f7]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#c084fc] transition-colors">Category Simulator</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Select a predefined legal category to play through scenario pools and test your rights.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#a855f7] pt-2">
                      Select Category <ArrowRight size={14} />
                    </div>
                  </button>

                  {/* Custom AI Simulator Option */}
                  <button
                    onClick={() => setSimulatorMode('custom')}
                    className="p-6 rounded-2xl border border-white/8 bg-slate-900/35 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 hover:shadow-[0_10px_30px_rgba(168,85,247,0.05)] transition-all flex flex-col items-center text-center space-y-4 shadow-lg group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Sparkles size={28} className="text-[#a855f7] animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#c084fc] transition-colors">Custom AI Simulator</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Describe a custom legal dispute and let LexAI generate a multi-stage scenario dynamically.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#a855f7] pt-2">
                      Enter Dispute <ArrowRight size={14} />
                    </div>
                  </button>
                </div>
              )}

              {/* Mode B: Category Selector */}
              {simulatorMode === 'category' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSimulatorMode('none')}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} /> Back to Modes
                    </button>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mode: Category Selector</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleSelectCategory(cat.name)}
                        disabled={submitting}
                        className="p-5 rounded-2xl border border-white/8 bg-slate-900/35 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 hover:shadow-[0_10px_30px_rgba(168,85,247,0.05)] transition-all flex items-start gap-4 text-left shadow-lg cursor-pointer group disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-white/8 flex items-center justify-center shrink-0 group-hover:border-[#a855f7]/40 transition-colors">
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#c084fc] transition-colors">{cat.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{cat.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode A: Custom Scenario Creator */}
              {simulatorMode === 'custom' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSimulatorMode('none')}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} /> Back to Modes
                    </button>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mode: Custom AI Generator</span>
                  </div>

                  <div className="p-6 rounded-2xl glass-premium shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-[#a855f7]">
                      <Sparkles size={18} className="animate-pulse" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">Describe Legal Problem</h4>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={customSituationText}
                        onChange={(e) => setCustomSituationText(e.target.value)}
                        placeholder="e.g., My landlord in Bangalore refuses to return my ₹50,000 security deposit, saying the walls have normal wear and tear but they want to charge me for painting."
                        rows={3}
                        disabled={generatingCustom}
                        className="w-full bg-slate-950/60 border border-white/8 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#a855f7]/40 resize-none transition-all"
                      />

                      {/* Language Selector */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Simulation Language:</span>
                        <div className="flex gap-2">
                          {[
                            { code: 'en', label: 'English' },
                            { code: 'hi', label: 'हिन्दी (Hindi)' },
                            { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
                          ].map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => setCustomLanguage(lang.code as any)}
                              type="button"
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${customLanguage === lang.code
                                ? 'bg-[#a855f7]/15 border-[#a855f7] text-white'
                                : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/80'
                                }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateCustomScenario}
                        disabled={!customSituationText.trim() || generatingCustom}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white hover:from-[#c084fc] hover:to-[#A855F7] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      >
                        {generatingCustom ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Generating dynamic scenario...
                          </>
                        ) : (
                          <>
                            Generate Custom Scenario <Sparkles size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Education Disclaimer */}
              <div className="max-w-md mx-auto p-4 rounded-xl border border-white/8 bg-slate-950/40 flex gap-2.5 text-[10px] text-slate-500 leading-relaxed shadow">
                <HelpCircle className="shrink-0 text-slate-600 mt-0.5" size={14} />
                <div>
                  <span className="font-bold text-slate-400 block mb-0.5">Education Disclaimer</span>
                  These simulations represent general legal guidance based on Indian acts. They do not constitute formal legal advice.
                </div>
              </div>

            </div>
          )}

          {/* ================= SCREEN 2: PLAYING SCREEN ================= */}
          {gameState === 'playing' && selectedScenario && activeNode && (
            <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto w-full">

              {/* Stepper progress tracker */}
              <div className="glass-premium p-4 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#c084fc]">Simulation Progress</span>
                  <span className="text-xs font-bold font-mono text-[#c084fc]">Score: {score} / {maxPossibleScore}</span>
                </div>

                {/* Connected Stage Nodes */}
                <div className="flex items-center justify-between w-full relative px-2 pt-2 pb-1">
                  {/* Connector Line Container */}
                  <div className="absolute top-5 left-[24px] right-[24px] h-0.5 z-0">
                    <div className="absolute inset-0 bg-slate-800" />
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-[#a855f7] transition-all duration-500"
                      style={{ width: `${(currentStageIndex / 4) * 100}%` }}
                    />
                  </div>

                  {stages.map((stageName, index) => {
                    const stageNum = index + 1;
                    const isActive = currentStageIndex === index;
                    const isCompleted = currentStageIndex > index;

                    return (
                      <div key={index} className="flex flex-col items-center z-10 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${isCompleted || isActive
                          ? 'bg-[#a855f7] text-white ring-4 ring-[#a855f7]/25 scale-110'
                          : 'bg-slate-950 border border-slate-800 text-slate-500'
                          }`}>
                          {stageNum}
                        </div>
                        <span className={`text-[9px] font-bold mt-2 hidden sm:block ${isActive || isCompleted ? 'text-white' : 'text-slate-500'
                          }`}>
                          {stageName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Character & Story Card */}
              <div className="p-6 rounded-2xl glass-premium shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center">
                    <Scale size={16} className="text-[#a855f7]" />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Character Role</span>
                    <p className="text-xs font-bold text-white leading-none">{selectedScenario.character}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-5 rounded-xl border border-white/5">
                  {activeNode.story}
                </p>
              </div>

              {/* Option choices */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1 mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">What is your next move?</span>
                  <span className="text-[9px] uppercase font-bold text-[#A855F7] animate-pulse">Double-click to confirm</span>
                </div>

                {Object.entries(activeNode.choices).map(([optionKey, text]) => (
                  <button
                    key={optionKey}
                    onClick={() => {
                      if (!submitting && !stepResult) setChosenOption(optionKey);
                    }}
                    onDoubleClick={() => handleChoiceSelect(optionKey)}
                    disabled={submitting}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] cursor-pointer group ${chosenOption === optionKey
                      ? 'bg-[#a855f7]/15 border-[#a855f7] text-white shadow-lg shadow-[#a855f7]/10'
                      : 'bg-slate-900/35 border-white/8 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 text-slate-300 hover:text-white'
                      }`}
                  >
                    <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border shrink-0 transition-colors ${chosenOption === optionKey
                      ? 'bg-[#a855f7] border-[#c084fc] text-white'
                      : 'bg-slate-950 border-white/8 text-slate-400 group-hover:border-[#a855f7]/40 group-hover:text-white'
                      }`}>
                      {optionKey}
                    </span>
                    <span className="text-xs leading-relaxed mt-0.5 select-none">{text as string}</span>
                    <ChevronRight size={14} className={`ml-auto shrink-0 self-center transition-colors ${chosenOption === optionKey ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* ================= SCREEN 3: GRADING SCREEN ================= */}
          {gameState === 'grading' && selectedScenario && activeNode && stepResult && (
            <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto w-full">

              {/* Stage Title Banner */}
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  {selectedScenario.isCategory ? "Category Scenario" : `Stage ${currentNodeId}: ${stages[currentStageIndex]}`}
                </span>
                <span className="text-xs font-bold font-mono text-[#c084fc]">Score: {score} / {maxPossibleScore}</span>
              </div>

              {/* Grading Card */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${getGradeColorClass(stepResult.grade)}`}>
                <div className="shrink-0 mt-0.5">
                  {getGradeIcon(stepResult.grade)}
                </div>
                <div className="space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold tracking-wider uppercase leading-none">
                      {getGradeText(stepResult.grade)}
                    </h4>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${stepResult.score_delta > 0
                      ? 'bg-[#a855f7]/10 border-[#a855f7]/30 text-[#c084fc]'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                      {stepResult.score_delta > 0 ? `+${stepResult.score_delta}` : stepResult.score_delta} Legal Points
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {stepResult.explanation}
                  </p>

                  {stepResult.citation && (
                    <div className="flex items-center gap-1.5 text-[10px] bg-slate-950/80 border border-white/5 px-2.5 py-1.5 rounded-lg w-fit">
                      <ShieldCheck size={12} className="text-[#a855f7]" />
                      <span className="text-slate-400">Legal Citation:</span>
                      <span className="font-bold text-[#c084fc]">{stepResult.citation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Q&A Box - Attached contextually under scenario result */}
              <div className="p-5 rounded-2xl glass-premium shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <MessageSquare size={16} className="text-[#c084fc]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Ask LexAI About This Scenario</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                    +5 Points Interaction Bonus
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Want to know why this is the case? Ask any questions about this situation. LexAI will explain under Indian law.
                </p>

                {/* Q&A logs */}
                {stepQAs.length > 0 && (
                  <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    {stepQAs.map((qa, index) => (
                      <div key={index} className="space-y-2 border-b border-white/5 pb-2.5 last:border-0 last:pb-0 text-xs">
                        <p className="font-bold text-[#c084fc] text-sm">Q: {qa.question}</p>
                        <FormattedExplanation text={qa.answer} />
                        {qa.citations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {qa.citations.map((c, cIdx) => (
                              <CitationTag key={cIdx} citation={c} purple={true} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Clickable Sample Queries */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Suggested Queries:</span>
                  <div className="flex flex-wrap gap-2">
                    {sampleQueries.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQaInputText(q)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-950/80 border border-white/5 text-slate-400 hover:text-white hover:border-[#a855f7]/40 hover:bg-[#a855f7]/5 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Input Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qaInputText}
                    onChange={(e) => setQaInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Ask why this option is better..."
                    disabled={qaLoading}
                    className="flex-1 bg-slate-950/60 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-[#a855f7]/40"
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!qaInputText.trim() || qaLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#a855f7] text-white hover:bg-[#c084fc] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {qaLoading ? "..." : "Ask AI"}
                  </button>
                </div>
              </div>

              {/* Proceed Action Button */}
              <div className="pt-2">
                <button
                  onClick={advanceStep}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white hover:from-[#c084fc] hover:to-[#A855F7] transition-all shadow-md active:scale-95 cursor-pointer hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  {hasAskedQuestionThisStep ? (
                    <>
                      Continue to Next Stage <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      Skip Q&A & Continue <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ================= SCREEN 4: END GAME SUMMARY SCREEN ================= */}
          {gameState === 'end' && selectedScenario && (
            <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-up">

              {/* Column 1: Summary & Rank */}
              <div className="p-6 rounded-2xl bg-[#0B1120]/55 shadow-2xl space-y-6 text-center border border-[#a855f7]/10 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-[#a855f7]/20 rounded-full animate-[pulse_2s_infinite] opacity-75"></div>
                    <div className="absolute inset-2 bg-gradient-to-tr from-[#A855F7] to-[#C084FC] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#a855f7]/40">
                      <Trophy size={42} />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest">Simulation Completed</span>
                    <h3 className="text-xl font-black text-[#FFFFFF]">{selectedScenario.title}</h3>
                    <p className="text-sm text-[#94A3B8] font-mono mt-1">Final Score: <span className="font-bold text-[#C084FC]">{score}</span> / {maxPossibleScore} points</p>
                  </div>

                  {/* Verdict Card */}
                  {(() => {
                    const scorePercentage = (score / maxPossibleScore) * 100;
                    let verdictTitle = '';
                    let verdictDesc = '';
                    if (scorePercentage < 40) {
                      verdictTitle = 'Needs Improvement';
                      verdictDesc = 'You understood some rights but missed key legal escalation paths.';
                    } else if (scorePercentage < 80) {
                      verdictTitle = 'Growing Awareness';
                      verdictDesc = 'You know basic protections but need stronger procedural decisions.';
                    } else {
                      verdictTitle = 'Strong Legal Awareness';
                      verdictDesc = 'You consistently chose lawful and strategic actions.';
                    }
                    return (
                      <div className="p-5 rounded-xl bg-[#0B1120]/80 border border-[#a855f7]/20 text-center space-y-1.5 mb-6">
                        <span className="text-xs font-black uppercase text-[#C084FC] tracking-wider block">Verdict: {verdictTitle}</span>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed px-2">
                          {verdictDesc}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Badge info */}
                  <div className="p-5 rounded-xl bg-[#0B1120]/80 border border-[#a855f7]/20 text-center space-y-1.5">
                    <span className="text-3xl block mb-1">{getBadgeDetails(score, maxPossibleScore).emoji}</span>
                    <span className="text-xs font-black uppercase text-[#C084FC] tracking-wider block">
                      Rank: {getBadgeDetails(score, maxPossibleScore).name}
                    </span>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed px-2">
                      {getBadgeDetails(score, maxPossibleScore).desc}
                    </p>

                    {/* Rank Progression */}
                    <div className="mt-4 pt-4 border-t border-[#a855f7]/10 text-left">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] uppercase font-bold text-[#94A3B8]">Progress to Next Rank</span>
                        <span className="text-[9px] font-mono text-[#C084FC]">{score} / {maxPossibleScore} XP</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden border border-[#a855f7]/20">
                        <div className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full" style={{ width: `${(score / maxPossibleScore) * 100}%`, transition: 'width 1s ease-out' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-8 relative z-10 pb-6">
                  <button
                    onClick={() => {
                      if (selectedScenario) {
                        startScenario(selectedScenario);
                      }
                    }}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#A855F7] to-[#C084FC] text-[#FFFFFF] hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                  >
                    Retry Scenario
                  </button>
                  <button
                    onClick={() => {
                      setGameState('select');
                      setSimulatorMode('none');
                    }}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-[#0B1120]/80 border border-[#a855f7]/30 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#a855f7]/60 hover:bg-[#a855f7]/10 transition-all active:scale-95 cursor-pointer"
                  >
                    Choose Another Scenario
                  </button>
                  <button
                    onClick={() => onHandoffToChat(`I just finished simulating the "${selectedScenario.title}" scenario. Let's discuss it further.`, `Scenario: ${selectedScenario.title}. Score achieved: ${score}/${maxPossibleScore}.`)}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-[#0B1120]/80 border border-[#a855f7]/30 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#a855f7]/60 hover:bg-[#a855f7]/10 transition-all active:scale-95 cursor-pointer"
                  >
                    Discuss with LexAI Chat
                  </button>
                </div>
              </div>

              {/* Column 2: Metrics & Breakdown */}
              <div className="p-6 rounded-2xl bg-[#0B1120]/55 shadow-xl space-y-8 border border-[#a855f7]/10 text-left flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Your Performance Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Correct Moves */}
                    <div className="p-4 bg-[#0B1120]/80 rounded-xl border border-[#a855f7]/10 flex flex-col justify-between">
                      <span className="text-[#94A3B8] text-[10px] font-bold block mb-2">Correct Moves</span>
                      <div className="flex items-baseline justify-between mt-auto">
                        <div className="font-mono flex items-baseline whitespace-nowrap">
                          <span className="text-2xl font-bold text-[#C084FC] leading-none">{choicesMade.filter(c => c.grade === 'correct').length}</span>
                          <span className="text-[#94A3B8] text-xs ml-1">/ 5</span>
                        </div>
                        <span className="text-[1.2rem] font-bold text-[#C084FC] whitespace-nowrap">{Math.round((choicesMade.filter(c => c.grade === 'correct').length / 5) * 100)}%</span>
                      </div>
                    </div>

                    {/* Risky Decisions */}
                    <div className="p-4 bg-[#0B1120]/80 rounded-xl border border-[#a855f7]/10 flex flex-col justify-between">
                      <span className="text-[#94A3B8] text-[10px] font-bold block mb-2">Risky Decisions</span>
                      <div className="flex items-baseline justify-between mt-auto">
                        <div className="font-mono flex items-baseline whitespace-nowrap">
                          <span className="text-2xl font-bold text-[#9333EA] leading-none">{choicesMade.filter(c => c.grade === 'risky').length}</span>
                          <span className="text-[#94A3B8] text-xs ml-1">/ 5</span>
                        </div>
                        <span className="text-[1.2rem] font-bold text-[#C084FC] whitespace-nowrap">{Math.round((choicesMade.filter(c => c.grade === 'risky').length / 5) * 100)}%</span>
                      </div>
                    </div>

                    {/* Illegal Shortcuts */}
                    <div className="p-4 bg-[#0B1120]/80 rounded-xl border border-[#a855f7]/10 flex flex-col justify-between">
                      <span className="text-[#94A3B8] text-[10px] font-bold block mb-2">Illegal Shortcuts</span>
                      <div className="flex items-baseline justify-between mt-auto">
                        <div className="font-mono flex items-baseline whitespace-nowrap">
                          <span className="text-2xl font-bold text-[#581C87] leading-none">{choicesMade.filter(c => c.grade === 'illegal').length}</span>
                          <span className="text-[#94A3B8] text-xs ml-1">/ 5</span>
                        </div>
                        <span className="text-[1.2rem] font-bold text-[#C084FC] whitespace-nowrap">{Math.round((choicesMade.filter(c => c.grade === 'illegal').length / 5) * 100)}%</span>
                      </div>
                    </div>

                    {/* Q&A Engagement */}
                    <div className="p-4 bg-[#0B1120]/80 rounded-xl border border-[#a855f7]/10 flex flex-col justify-between">
                      <span className="text-[#94A3B8] text-[10px] font-bold block mb-2">Q&A Engagement</span>
                      <div className="flex items-baseline justify-between mt-auto">
                        <div className="font-mono flex items-baseline whitespace-nowrap">
                          <span className="text-2xl font-bold text-[#E9D5FF] leading-none">{qaBonusCount}</span>
                          <span className="text-[#94A3B8] text-xs ml-1">/ {selectedScenario?.isCategory ? 1 : 5}</span>
                        </div>
                        <span className="text-[10px] text-[#C084FC] font-bold uppercase tracking-wider">BONUS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mt-6 relative z-10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-5">Level Wise Score Breakdown</h4>
                  <div className="space-y-4">
                    {['Discovery', 'Complication', 'Escalation', 'Legal Action', 'Resolution'].map((levelName, idx) => {
                      const levelChoice = choicesMade[idx];
                      const levelScore = levelChoice ? levelChoice.score : 0;
                      const maxLevelScore = 15;
                      const percentage = (levelScore / maxLevelScore) * 100;

                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-[#FFFFFF] w-24 shrink-0">{idx + 1}. {levelName}</span>
                          <div className="flex-1 h-1.5 bg-[#0B1120] rounded-full overflow-hidden border border-[#a855f7]/10">
                            <div className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full" style={{ width: `${percentage}%`, transition: 'width 0.6s ease' }}></div>
                          </div>
                          <span className="text-[10px] font-mono text-[#94A3B8] w-10 text-right">{levelScore} / {maxLevelScore}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Column 3: Learnings & Laws */}
              <div className="p-6 rounded-2xl bg-[#0B1120]/55 shadow-xl space-y-8 border border-[#a855f7]/10 text-left flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex-1 relative z-10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-5">Key Legal Takeaways</h4>
                  <div className="relative space-y-6">
                    {(() => {
                      const takeaways = generateLegalTakeaways(choicesMade, selectedScenario);

                      if (takeaways.length === 0) {
                        return (
                          <div className="p-4 rounded-xl border border-dashed border-[#a855f7]/20 text-center">
                            <p className="text-xs text-[#94A3B8] italic">No learnings were recorded for this simulation.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative">
                          {/* Timeline vertical line */}
                          {takeaways.length > 1 && (
                            <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#a855f7]/50 via-[#a855f7]/10 to-[#a855f7]/50 z-0"></div>
                          )}

                          <div className="space-y-6 relative z-10">
                            {takeaways.map((snippet, idx) => {
                              let Icon = ShieldCheck;
                              if (idx % 4 === 1) Icon = Scale;
                              if (idx % 4 === 2) Icon = BookOpen;
                              if (idx % 4 === 3) Icon = Sparkles;

                              return (
                                <div key={idx} className="relative flex items-start gap-4">
                                  <div className="w-8 h-8 shrink-0 rounded-full bg-[#0B1120] relative z-10 flex items-center justify-center border border-[#a855f7]/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                                    <Icon size={14} className="text-[#C084FC]" />
                                  </div>
                                  <div className="flex-1 pt-1.5">
                                    <p className="text-xs text-[#FFFFFF] leading-relaxed font-medium">
                                      {snippet}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Achievements */}
                {(() => {
                  const correctCount = choicesMade.filter(c => c.grade === 'correct').length;
                  const hasBonus = qaBonusCount > 0;
                  const scorePerc = (score / maxPossibleScore) * 100;
                  const achievements = [];
                  if (correctCount >= 4) achievements.push({ icon: Scale, name: 'Rights Defender' });
                  if (hasBonus) achievements.push({ icon: BookOpen, name: 'Law Explorer' });
                  if (scorePerc >= 90) achievements.push({ icon: Sparkles, name: 'Critical Thinker' });

                  if (achievements.length === 0) return null;

                  return (
                    <div className="p-5 rounded-xl bg-[#0B1120]/80 border border-[#a855f7]/20 space-y-4 relative z-10">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Unlocked Achievements</h4>
                      <div className="flex flex-wrap gap-2">
                        {achievements.map((ach, index) => {
                          const Icon = ach.icon;
                          return (
                            <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/30">
                              <Icon size={12} className="text-[#C084FC]" />
                              <span className="text-[10px] font-bold text-[#FFFFFF]">{ach.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {citedLaws.length > 0 && (
                  <div className="p-5 rounded-xl bg-[#0B1120]/80 border border-[#a855f7]/20 space-y-4 relative z-10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Key Laws Explored</h4>
                    <div className="flex flex-wrap gap-2">
                      {citedLaws.map((law, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#a855f7]/10 border border-[#a855f7]/40 text-[#C084FC] shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                        >
                          {law.act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
