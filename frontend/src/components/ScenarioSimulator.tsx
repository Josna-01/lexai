import React, { useState, useEffect } from 'react';
import {
  Factory, Laptop, ShieldAlert, Scale,
  ArrowRight, Trophy, HelpCircle, Sparkles,
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, MessageSquare, Play, RefreshCw, BookOpen
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
}

interface StepResponse {
  grade: 'correct' | 'risky' | 'illegal' | 'legal';
  explanation: string;
  citation: string;
  score_delta: number;
  next_node: string;
}

interface QAItem {
  question: string;
  answer: string;
  citations: Citation[];
}

interface ScenarioSimulatorProps {
  onHandoffToChat: (initialQuery: string, contextDescription: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onHandoffToChat }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
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
  const [customScenarioNodes, setCustomScenarioNodes] = useState<any>(null);

  // Current step Q&A state
  const [qaInputText, setQaInputText] = useState<string>('');
  const [stepQAs, setStepQAs] = useState<QAItem[]>([]);
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [hasAskedQuestionThisStep, setHasAskedQuestionThisStep] = useState<boolean>(false);

  // Cumulative game stats
  const [citedLaws, setCitedLaws] = useState<Citation[]>([]);
  const [choicesMade, setChoicesMade] = useState<Array<{ step: string, grade: string, score: number }>>([]);
  const [qaBonusCount, setQaBonusCount] = useState<number>(0);

  // Fetch scenarios list on mount
  useEffect(() => {
    fetch('/api/simulation/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(err => console.error("Error loading scenarios:", err));
  }, []);

  // Client-side mapping of scenarios to render the story nodes (matches backend scenarios.py)
  const clientScenarios: Record<number | string, any> = {
    1: {
      nodes: {
        "1": {
          story: "You're Ravi. You work at a textile factory in Mangaluru. Your employer has not paid your salary for 3 months. Today you ask him for your wages, and he dismisses you saying, 'Business is slow, come back next week.' You need this money for your rent and family expenses.",
          choices: {
            "A": "Keep waiting. You don't want to make a fuss or risk losing your job.",
            "B": "File a claim with the Labour Commissioner.",
            "C": "Protest and block the factory gate.",
            "D": "Go to the local police station to file a complaint."
          }
        },
        "2": {
          story: "The factory manager finds out you are planning to take legal action. He calls you into his office and threatens to fire you immediately if you contact any government official. He demands that you sign a document stating you have received all your wages.",
          choices: {
            "A": "Sign the document to keep your job.",
            "B": "Refuse to sign and record the audio of the threat secretly as evidence.",
            "C": "Write an angry email back to the manager cc'ing all staff.",
            "D": "Resign immediately on the spot."
          }
        },
        "3": {
          story: "The manager realizes you won't back down. He offers a compromise: the factory will pay you 50% of your unpaid wages immediately, but only if you sign a waiver releasing them from any further legal claims.",
          choices: {
            "A": "Sign the waiver and take the 50% cash.",
            "B": "Reject the offer, demanding 100% of your wages + compensation.",
            "C": "Ask your co-workers what they think you should do.",
            "D": "File a lawsuit in the local civil court."
          }
        },
        "4": {
          story: "The Labour Commissioner schedules a formal hearing. The factory manager brings a corporate lawyer, but you cannot afford representation. The hearing is about to begin.",
          choices: {
            "A": "Do not show up for the hearing out of fear.",
            "B": "Contact the District Legal Services Authority (DLSA) for free representation.",
            "C": "Take a high-interest local loan to hire a private attorney.",
            "D": "Represent yourself and present your bank statements and attendance registers."
          }
        },
        "5": {
          story: "Resolution. The Labour Commissioner rules in your favor, ordering the employer to pay your full wages plus ₹50,000 in compensation. However, the manager tells you he will delay the payment by appealing the decision.",
          choices: {
            "A": "File an execution application in the Labour Court to enforce the order.",
            "B": "Sit outside the factory on a hunger strike.",
            "C": "Physically block the manager's car until he signs the cheque.",
            "D": "Pay a fee to a collections agency to retrieve the cash."
          }
        }
      }
    },
    2: {
      nodes: {
        "1": {
          story: "You're Priya. You ordered a laptop online for college, costing ₹45,050. When you open the package, you find a couple of heavy stones instead of a laptop. You call customer service, but they claim, 'Our delivery records show the package weight was correct. No refund will be issued.'",
          choices: {
            "A": "Accept the loss and buy a cheaper laptop.",
            "B": "Draft a formal complaint showing unboxing video/photos, and send it to the seller.",
            "C": "Post a viral thread complaining on social media.",
            "D": "File a police FIR for delivery theft."
          }
        },
        "2": {
          story: "Instead of resolving the issue, the e-commerce company blocks your account, accusing you of fraud and claiming they have blacklisted your IP address.",
          choices: {
            "A": "File a grievance online with the National Consumer Helpline (NCH).",
            "B": "Create fake accounts to spam their customer service representatives.",
            "C": "Send a formal legal notice through registered post.",
            "D": "Contact your bank to raise a payment chargeback/dispute."
          }
        },
        "3": {
          story: "The company's legal department replies to your legal notice by threatening a multi-crore defamation lawsuit against you if you do not delete your social media posts regarding the incident.",
          choices: {
            "A": "Delete all posts out of fear and apologize.",
            "B": "Ignore their threat and proceed with filing a consumer case.",
            "C": "Start an online public petition on Change.org.",
            "D": "Consult the DLSA/Legal Aid Clinic regarding the defamation threat."
          }
        },
        "4": {
          story: "You decide to file a formal case online using the government's e-Daakhil portal. However, you are confused about which Consumer Commission has the authority to handle your ₹45,000 claim.",
          choices: {
            "A": "File the case in the National Consumer Disputes Redressal Commission.",
            "B": "File the case in the District Consumer Commission.",
            "C": "File the case in the State Consumer Commission.",
            "D": "File a petition directly in the Supreme Court of India."
          }
        },
        "5": {
          story: "Resolution. The District Consumer Commission orders the online seller to refund your ₹45,000, pay ₹10,000 as compensation for mental harassment, and ₹5,000 as litigation costs. The seller ignores the order.",
          choices: {
            "A": "File an execution application under Section 72 of the Consumer Protection Act, 2019.",
            "B": "Write a public review calling the CEO a thief and liar.",
            "C": "File another fresh complaint about the non-payment.",
            "D": "Wait for the company nodal officers to contact you."
          }
        }
      }
    },
    3: {
      nodes: {
        "1": {
          story: "You're Aisha, a college student. You discover that a fake Instagram page has uploaded morphed, private photos of you, accompanied by derogatory comments. The page is gaining followers in your college group. You are panic-stricken.",
          choices: {
            "A": "Delete all your social media accounts and hide in your room.",
            "B": "Take screenshots, record the page URL, and report the account on Instagram.",
            "C": "Message the account to argue and threaten them.",
            "D": "Report the matter to your college principal."
          }
        },
        "2": {
          story: "Instagram's automated support replies that the page does not violate their community guidelines and refuses to take it down. The photos are still circulating.",
          choices: {
            "A": "File an official complaint on the National Cyber Crime Reporting Portal.",
            "B": "Ask all your friends to mass-report the page.",
            "C": "Pay a private online hacker service to take down the account.",
            "D": "Go to the cyber crime police station to file a complaint under Section 66E/67."
          }
        },
        "3": {
          story: "You go to the local police station, but the duty officer is dismissive. He says, 'It's just a college prank, you kids shouldn't put photos online. Just delete your accounts, we can't file an FIR for this.'",
          choices: {
            "A": "Accept what he says, feel ashamed, and go home.",
            "B": "Submit a written complaint to the Superintendent of Police (SP) or Cyber Crime Unit.",
            "C": "Post a tweet tags the police department calling them out.",
            "D": "Contact DLSA to request free legal representation and protection."
          }
        },
        "4": {
          story: "Through the Cyber Cell investigation, the IP address is traced, and the culprit is identified. It is a 17-year-old classmate. Aisha wonders how the criminal justice system handles him.",
          choices: {
            "A": "Demand he be locked up in an adult prison with hardened criminals.",
            "B": "Proceed with the case in front of the Juvenile Justice Board.",
            "C": "Gather friends to beat him up or threaten him at college.",
            "D": "File a civil lawsuit for monetary compensation against his parents."
          }
        },
        "5": {
          story: "Resolution. The Juvenile Justice Board places the classmate under probation for 1 year and orders him and his parents to delete all digital materials and write a formal apology. However, you notice someone has re-uploaded the morphed photos on another profile.",
          choices: {
            "A": "Submit a takedown request to Instagram's grievance officer under IT Rules 2021.",
            "B": "Re-share the photos yourself to warn others about the leak.",
            "C": "Try to find out who the new anonymous poster is on your own.",
            "D": "Message the poster begging them to delete it."
          }
        }
      }
    }
  };

  const getActiveNode = () => {
    if (!selectedScenario) return null;
    if (selectedScenario.isCustom) {
      return customScenarioNodes?.[currentNodeId] || null;
    }
    return clientScenarios[selectedScenario.id]?.nodes[currentNodeId] || null;
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

      const response = await fetch('/api/simulation/generate', {
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
      setCustomScenarioNodes(data.nodes);

      const dynamicScenario: Scenario = {
        id: 'custom_' + Date.now(),
        title: data.title || "Your Custom Legal Journey",
        act: "Indian Legislation",
        character: data.character || "Citizen",
        description: customSituationText.trim(),
        icon: "Scale",
        start_node: "1",
        isCustom: true
      };

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

      let response;
      if (selectedScenario.isCustom) {
        response = await fetch('/api/simulation/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            situation: selectedScenario.description,
            story: activeNode.story,
            choice_key: option,
            choice_text: activeNode.choices[option]
          })
        });
      } else {
        response = await fetch('/api/simulation/step', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scenario_id: selectedScenario.id,
            current_node_id: currentNodeId,
            user_choice: option
          })
        });
      }

      if (!response.ok) {
        throw new Error("Failed to process simulation step");
      }

      const result: StepResponse = await response.json();
      
      // Enforce custom grade mapping: Correct = +10, Also Good = +7, Risky = +3, Illegal = 0
      let mappedScore = 3;
      let gradeLabel = 'risky';

      if (result.grade === 'correct' || result.grade === 'legal') {
        if (result.score_delta >= 15) {
          gradeLabel = 'correct';
          mappedScore = 10;
        } else {
          gradeLabel = 'correct'; // or Also Good depending on delta
          mappedScore = 7;
        }
      } else if (result.grade === 'illegal') {
        gradeLabel = 'illegal';
        mappedScore = 0;
      } else {
        // risky
        if (result.score_delta >= 5 && result.score_delta <= 10) {
          gradeLabel = 'correct'; // Map positive neutral to Also Good
          mappedScore = 7;
        } else {
          gradeLabel = 'risky';
          mappedScore = 3;
        }
      }

      // Final Override step checks:
      if (selectedScenario.isCustom) {
        if (result.grade === 'correct') {
          gradeLabel = 'correct';
          mappedScore = 10;
        } else if (result.grade === 'illegal') {
          gradeLabel = 'illegal';
          mappedScore = 0;
        } else {
          gradeLabel = 'risky';
          mappedScore = 3;
        }
      }

      const finalResult: StepResponse = {
        ...result,
        grade: gradeLabel as any,
        score_delta: mappedScore
      };

      setStepResult(finalResult);
      setScore(prev => prev + mappedScore);

      // Save choices statistics
      setChoicesMade(prev => [...prev, { step: currentNodeId, grade: gradeLabel, score: mappedScore }]);

      // Accumulate cited laws
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

      // Move straight to grading screen state
      setGameState('grading');
    } catch (err) {
      console.error(err);
      alert("Error submitting choice. Make sure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit follow-up question to LexAI within current simulation context
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

    const groundingContext = `Grounding Context: We are in a Legal Simulator game stage. Scenario: "${selectedScenario.title}". Character: "${selectedScenario.character}". Current Situation: "${situationStr}". The user chose: "${choiceStr}". LexAI evaluated this action as: "${gradeStr}" with explanation: "${explanationStr}". Please answer the user's specific follow-up question regarding this stage and their legal choices, citing the exact sections of Indian law.`;

    try {
      const response = await fetch('/api/chat', {
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

      // Add citations to cumulative cited list
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

      // Enforce Q&A bonus of +5 points (once per stage)
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
    if (selectedScenario.isCustom) {
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
    } else {
      const nextNode = stepResult.next_node;
      if (nextNode === 'end' || currentNum >= 5) {
        setGameState('end');
      } else {
        setCurrentNodeId(nextNode);
        setChosenOption(null);
        setStepResult(null);
        setStepQAs([]);
        setHasAskedQuestionThisStep(false);
        setGameState('playing');
      }
    }
  };

  const getGradeColorClass = (grade: string) => {
    if (grade === 'correct') return 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]';
    if (grade === 'risky') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  };

  const getGradeText = (grade: string) => {
    if (grade === 'correct') return 'CORRECT / RECOMMENDED MOVE';
    if (grade === 'risky') return 'RISKY / INEFFECTIVE MOVE';
    return 'ILLEGAL / HARMFUL MOVE';
  };

  const getGradeIcon = (grade: string) => {
    if (grade === 'correct') return <CheckCircle2 className="text-[#F5C518]" size={24} />;
    if (grade === 'risky') return <AlertTriangle className="text-amber-400" size={24} />;
    return <XCircle className="text-rose-400" size={24} />;
  };

  const getScenarioIcon = (iconName: string) => {
    if (iconName === 'Factory') return <Factory size={22} className="text-[#a855f7]" />;
    if (iconName === 'Laptop') return <Laptop size={22} className="text-[#F5C518]" />;
    return <ShieldAlert size={22} className="text-rose-400" />;
  };

  const getBadgeDetails = (finalScore: number) => {
    if (finalScore >= 65) {
      return { name: "Rights Champion", emoji: "🏆", desc: "Superb! You demonstrated a complete understanding of statutory protections and correct enforcement mechanisms." };
    }
    if (finalScore >= 50) {
      return { name: "Legal Eagle", emoji: "🦅", desc: "Good job! You understand your basic rights and successfully navigated most procedural steps." };
    }
    if (finalScore >= 35) {
      return { name: "Civic Learner", emoji: "📘", desc: "You have basic awareness of legal options but fell into procedural traps. Keep learning!" };
    }
    return { name: "Just Starting", emoji: "🌱", desc: "You learned what NOT to do. Protecting yourself legally requires appealing to proper authorities." };
  };

  const getAlternativeExplanations = () => {
    if (!selectedScenario || !chosenOption || selectedScenario.isCustom) return null;
    const activeNode = getActiveNode();
    const presetScenario = clientScenarios[selectedScenario.id];
    if (!activeNode || !presetScenario) return null;

    const fullNode = presetScenario.nodes[currentNodeId];
    if (!fullNode) return null;

    const alternatives = Object.entries(fullNode.choices).filter(([key]) => key !== chosenOption);
    return alternatives;
  };

  const activeNode = getActiveNode();
  const stages = ["Discovery", "Complication", "Escalation", "Legal Action", "Resolution"];
  const currentStageIndex = parseInt(currentNodeId) - 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative w-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#a855f7]/20 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6">

        {/* ================= SCREEN 1: SELECTION SCREEN ================= */}
        {gameState === 'select' && (
          <div className="space-y-8 animate-fade-up">
            
            {/* Header Title */}
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h3 className="text-2xl font-black text-white font-display tracking-tight uppercase">Rights Simulator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Play through realistic scenarios based on Indian civic legislation, or generate your own custom legal scenario using AI.
              </p>
            </div>

            {/* Custom Scenario Generator Box */}
            <div className="p-6 rounded-2xl glass-premium shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-[#a855f7]">
                <Sparkles size={18} className="animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Generate Custom AI Scenario</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Describe a legal problem you or someone else faced (e.g. landlord tenant issues, cyber harassment, online shopping scam). LexAI will dynamically construct a 5-step scenario and grade your actions.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={customSituationText}
                  onChange={(e) => setCustomSituationText(e.target.value)}
                  placeholder="e.g., My landlord in Bangalore refuses to return my ₹50,000 security deposit, saying the walls have normal wear and tear but they want to charge me for painting."
                  rows={2}
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          customLanguage === lang.code
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
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#a855f7] text-white hover:bg-[#c084fc] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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

            {/* Default Scenarios Grid */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 block px-1 tracking-wider">Or Select a Preset Scenario</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-5 rounded-2xl border border-white/8 bg-slate-900/35 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 hover:shadow-[0_10px_30px_rgba(168,85,247,0.05)] transition-all flex flex-col justify-between shadow-lg h-[240px] relative group overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-white/8 flex items-center justify-center">
                        {getScenarioIcon(sc.icon)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#c084fc] transition-colors">{sc.title}</h4>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{sc.act}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                        {sc.description}
                      </p>
                    </div>

                    <button
                      onClick={() => startScenario(sc)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#a855f7] text-white hover:bg-[#c084fc] transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Start Game <Play size={10} fill="#ffffff" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

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

        {/* ================= SCREEN 2: GAMEPLAY SCREEN ================= */}
        {gameState === 'playing' && selectedScenario && activeNode && (
          <div className="space-y-6 animate-fade-up">

            {/* Stepper progress tracker */}
            <div className="glass-premium p-4 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#F5C518]">Simulation Progress</span>
                <span className="text-xs font-bold font-mono text-[#F5C518]">Score: {score} / 75</span>
              </div>

              {/* Connected Stage Nodes */}
              <div className="flex items-center justify-between w-full relative px-2 pt-2 pb-1">
                {/* Connector Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800 z-0" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-[#F5C518] z-0 transition-all duration-500" 
                  style={{ width: `${(currentStageIndex / 4) * 100}%` }}
                />

                {stages.map((stageName, index) => {
                  const stageNum = index + 1;
                  const isActive = currentStageIndex === index;
                  const isCompleted = currentStageIndex > index;
                  
                  return (
                    <div key={index} className="flex flex-col items-center z-10 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isCompleted || isActive
                          ? 'bg-[#F5C518] text-slate-950 ring-4 ring-[#F5C518]/25 scale-110'
                          : 'bg-slate-950 border border-slate-800 text-slate-500'
                      }`}>
                        {stageNum}
                      </div>
                      <span className={`text-[9px] font-bold mt-2 hidden sm:block ${
                        isActive || isCompleted ? 'text-white' : 'text-slate-500'
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

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4.5 rounded-xl border border-white/5">
                {activeNode.story}
              </p>
            </div>

            {/* Option choices */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">What is your next move?</span>

              {Object.entries(activeNode.choices).map(([optionKey, text]) => (
                <button
                  key={optionKey}
                  onClick={() => handleChoiceSelect(optionKey)}
                  disabled={submitting}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] cursor-pointer group ${
                    chosenOption === optionKey
                      ? 'bg-[#a855f7]/15 border-[#a855f7] text-white shadow-lg shadow-[#a855f7]/10'
                      : 'bg-slate-900/35 border-white/8 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border shrink-0 transition-colors ${
                    chosenOption === optionKey
                      ? 'bg-[#a855f7] border-[#c084fc] text-white'
                      : 'bg-slate-950 border-white/8 text-slate-400 group-hover:border-[#a855f7]/40 group-hover:text-white'
                  }`}>
                    {optionKey}
                  </span>
                  <span className="text-xs leading-relaxed mt-0.5">{text as string}</span>
                  <ChevronRight size={14} className="ml-auto shrink-0 self-center text-slate-500 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>

          </div>
        )}

        {/* ================= SCREEN 3: GRADING SCREEN ================= */}
        {gameState === 'grading' && selectedScenario && activeNode && stepResult && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Stage Title Banner */}
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Stage {currentNodeId}: {stages[currentStageIndex]}
              </span>
              <span className="text-xs font-bold font-mono text-[#F5C518]">Score: {score} / 75</span>
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
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    stepResult.score_delta > 0
                      ? 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]'
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
                    <ShieldCheck size={12} className="text-[#F5C518]" />
                    <span className="text-slate-400">Legal Citation:</span>
                    <span className="font-bold text-[#F5C518]">{stepResult.citation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alternate Choices Breakdown (Only for preset scenarios) */}
            {getAlternativeExplanations() && (
              <div className="p-5 rounded-2xl glass-premium shadow-md space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-[#a855f7]" /> Other available paths:
                </h4>
                <div className="space-y-3 pt-1">
                  {getAlternativeExplanations()?.map(([key, choiceText]: any) => (
                    <div key={key} className="text-xs leading-relaxed border-l-2 border-white/10 pl-3 space-y-1">
                      <p className="font-semibold text-slate-300">
                        Option {key}: <span className="font-normal text-slate-400">{choiceText as string}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Q&A Box */}
            <div className="p-5 rounded-2xl glass-premium shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare size={16} className="text-[#F5C518]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Ask LexAI About This Stage</span>
                </div>
                <span className="text-[9px] uppercase font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                  +5 Points Interaction Bonus
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Want to know why this is the case? Ask any questions about this situation (e.g. what is the time limit to file, is it a cognizable offense?). LexAI will explain under Indian law.
              </p>

              {/* Q&A logs */}
              {stepQAs.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  {stepQAs.map((qa, index) => (
                    <div key={index} className="space-y-2 border-b border-white/5 pb-2.5 last:border-0 last:pb-0 text-xs">
                      <p className="font-bold text-[#F5C518]">Q: {qa.question}</p>
                      <p className="text-slate-300 leading-relaxed">{qa.answer}</p>
                      {qa.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {qa.citations.map((c, cIdx) => (
                            <CitationTag key={cIdx} citation={c} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Text Input Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qaInputText}
                  onChange={(e) => setQaInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="Ask a legal query about this stage..."
                  disabled={qaLoading}
                  className="flex-1 bg-slate-950/60 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-[#F5C518]/40"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={!qaInputText.trim() || qaLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F5C518] text-slate-950 hover:bg-[#ffe169] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {qaLoading ? "..." : "Ask AI"}
                </button>
              </div>
            </div>

            {/* Proceed Action Button */}
            <div className="pt-2">
              <button
                onClick={advanceStep}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-[#a855f7] text-white hover:bg-[#c084fc] transition-all shadow-md active:scale-95 cursor-pointer"
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
          <div className="max-w-md mx-auto space-y-6 text-center animate-fade-up">

            {/* Badge Unlocked Trophy Container */}
            <div className="p-6 rounded-2xl glass-premium shadow-2xl space-y-4">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-[#F5C518]/10 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-[#F5C518] to-[#ffe169] rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-[#F5C518]/30">
                  <Trophy size={42} />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Simulation Completed</span>
                <h3 className="text-lg font-black text-white">{selectedScenario.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Final Score: <span className="font-bold text-[#F5C518]">{score}</span> / 75 points</p>
              </div>

              {/* Badge info */}
              <div className="p-4.5 rounded-xl bg-slate-950/80 border border-white/5 text-center space-y-2">
                <span className="text-2xl block">{getBadgeDetails(score).emoji}</span>
                <span className="text-xs font-black uppercase text-[#F5C518] tracking-wider">
                  Rank Badge: {getBadgeDetails(score).name}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                  {getBadgeDetails(score).desc}
                </p>
              </div>
            </div>

            {/* Performance Statistics Grid */}
            <div className="p-5 rounded-2xl glass-premium text-left space-y-3.5 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Action Statistics</h4>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold block">Correct Moves</span>
                  <span className="text-sm font-bold text-[#F5C518] font-mono">
                    {choicesMade.filter(c => c.grade === 'correct').length} / 5
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold block">Risky Decisions</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {choicesMade.filter(c => c.grade === 'risky').length} / 5
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold block">Illegal Shortcuts</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {choicesMade.filter(c => c.grade === 'illegal').length} / 5
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold block">Q&A Engagement</span>
                  <span className="text-sm font-bold text-[#a855f7] font-mono">
                    {qaBonusCount} / 5 (+{qaBonusCount * 5} pts)
                  </span>
                </div>
              </div>
            </div>

            {/* Laws Cited summary list */}
            {citedLaws.length > 0 && (
              <div className="p-5 rounded-2xl glass-premium text-left space-y-3 shadow-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cited Indian Laws Explored:</h4>
                <div className="flex flex-wrap gap-2">
                  {citedLaws.map((law, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F5C518]/15 border border-[#F5C518]/30 text-[#F5C518]"
                    >
                      {law.act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation options */}
            <div className="space-y-2">
              <button
                onClick={() => setGameState('select')}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#a855f7] text-white hover:bg-[#c084fc] transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Choose Another Scenario
              </button>
              <button
                onClick={() => onHandoffToChat(`I just finished simulating the "${selectedScenario.title}" scenario. Let's discuss it further.`, `Scenario: ${selectedScenario.title}. Score achieved: ${score}/75.`)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-white/8 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                Discuss with LexAI Chat
              </button>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
};
