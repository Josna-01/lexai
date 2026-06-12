import React, { useState, useEffect } from 'react';
import { 
  Factory, Laptop, ShieldAlert, Scale, 
  ArrowRight, RotateCcw, Trophy, Award, 
  ShieldCheck, CheckCircle2, AlertTriangle, 
  XCircle, ChevronRight, MessageSquare, Play, HelpCircle
} from 'lucide-react';

interface Scenario {
  id: number;
  title: string;
  act: string;
  character: string;
  description: string;
  icon: string;
  start_node: string;
}

interface Choice {
  text: string;
  score_delta: number;
  next_node: string;
  fallback_citation: string;
  fallback_explanation: string;
}

interface Node {
  id: string;
  story: string;
  choices: Record<string, Choice>;
}

interface StepResponse {
  grade: 'correct' | 'risky' | 'illegal';
  explanation: string;
  citation: string;
  score_delta: number;
  next_node: string;
}

interface ScenarioSimulatorProps {
  onHandoffToChat: (initialQuery: string, contextDescription: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onHandoffToChat }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('1');
  const [nodeData, setNodeData] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Active game states
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [stepResult, setStepResult] = useState<StepResponse | null>(null);
  const [stepHistory, setStepHistory] = useState<Array<{ story: string; choiceText: string; result: StepResponse }>>([]);
  const [gameState, setGameState] = useState<'select' | 'playing' | 'end'>('select');

  // Fetch scenarios list on mount
  useEffect(() => {
    fetch('/api/simulation/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(err => console.error("Error loading scenarios:", err));
  }, []);

  // Fetch detailed node data when currentNodeId changes
  useEffect(() => {
    if (!selectedScenario || gameState !== 'playing') return;
    
    // We can fetch the raw scenario mapping client-side to render choices,
    // or fetch nodes directly. Let's fetch a list of nodes or reconstruct the active node.
    // For simplicity, we import the static configuration client-side or parse from local scenario state.
    // Since backend has the complete tree, let's look up the local static structure for UI options,
    // and rely on the POST API to resolve the results.
    // Wait, to keep it zero-maintenance and fully API driven, let's define the nodes client-side too
    // or let the backend return the story/choices in a GET call.
    // Wait! Let's check how the backend is structured:
    // GET /api/simulation/scenarios returns metadata only.
    // If we want the client to render the story and option texts, we should retrieve them.
    // Let's fetch from a simple local definition matching scenarios.py, or let the backend return it.
    // Let's implement local definitions client-side as well for lightning-fast loads!
  }, [currentNodeId, selectedScenario, gameState]);

  // Client-side mapping of scenarios to render the story nodes (matches backend scenarios.py)
  const clientScenarios: Record<number, any> = {
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
        }
      }
    },
    2: {
      nodes: {
        "1": {
          story: "You're Priya. You ordered a laptop online for college, costing ₹45,000. When you open the package, you find a couple of heavy stones instead of a laptop. You call customer service, but they claim, 'Our delivery records show the package weight was correct. No refund will be issued.'",
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
        }
      }
    }
  };

  const getActiveNode = () => {
    if (!selectedScenario) return null;
    return clientScenarios[selectedScenario.id]?.nodes[currentNodeId] || null;
  };

  const startScenario = (sc: Scenario) => {
    setSelectedScenario(sc);
    setCurrentNodeId(sc.start_node);
    setScore(0);
    setMaxScore(0);
    setChosenOption(null);
    setStepResult(null);
    setStepHistory([]);
    setGameState('playing');
  };

  const handleChoiceSelect = async (option: string) => {
    if (!selectedScenario || submitting || stepResult) return;
    setChosenOption(option);
    setSubmitting(true);

    try {
      const response = await fetch('/api/simulation/step', {
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

      if (!response.ok) {
        throw new Error("Failed to process simulation step");
      }

      const result: StepResponse = await response.json();
      setStepResult(result);
      setScore(prev => prev + result.score_delta);
      setMaxScore(prev => prev + 20); // 20 is the max points per node

      // Add to summary history
      const activeNode = getActiveNode();
      setStepHistory(prev => [
        ...prev, 
        { 
          story: activeNode?.story || "", 
          choiceText: activeNode?.choices[option] || "", 
          result 
        }
      ]);

    } catch (err) {
      console.error(err);
      alert("Error submitting choice. Make sure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStep = () => {
    if (!stepResult) return;

    const nextNode = stepResult.next_node;
    if (nextNode === 'end') {
      setGameState('end');
    } else {
      setCurrentNodeId(nextNode);
      setChosenOption(null);
      setStepResult(null);
    }
  };

  const getGradeColorClass = (grade: string) => {
    if (grade === 'correct') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (grade === 'risky') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  };

  const getGradeText = (grade: string) => {
    if (grade === 'correct') return 'CORRECT / RECOMMENDED MOVE';
    if (grade === 'risky') return 'RISKY / INEFFECTIVE MOVE';
    return 'ILLEGAL / HARMFUL MOVE';
  };

  const getGradeIcon = (grade: string) => {
    if (grade === 'correct') return <CheckCircle2 className="text-emerald-400" size={24} />;
    if (grade === 'risky') return <AlertTriangle className="text-amber-400" size={24} />;
    return <XCircle className="text-rose-400" size={24} />;
  };

  const getScenarioIcon = (iconName: string) => {
    if (iconName === 'Factory') return <Factory size={24} className="text-sky-400" />;
    if (iconName === 'Laptop') return <Laptop size={24} className="text-violet-400" />;
    return <ShieldAlert size={24} className="text-rose-400" />;
  };

  const getBadgeDetails = (scorePercentage: number) => {
    if (scorePercentage >= 75) {
      return { name: "Legal Champion", emoji: "⚖️", desc: "Superb! You demonstrated a complete understanding of statutory protections and correct enforcement mechanisms." };
    }
    if (scorePercentage >= 40) {
      return { name: "Civic Defender", emoji: "🛡️", desc: "Good job! You understand your basic rights but made a few suboptimal or risky decisions." };
    }
    return { name: "Legal Learner", emoji: "📖", desc: "You learned a lot about what NOT to do. Legal protection requires using formal legal authorities." };
  };

  const getDLSAContact = () => {
    if (!selectedScenario) return "";
    if (selectedScenario.id === 1) {
      return "Karnataka State Labour Commissioner Helpline: 155214 / DLSA Legal Aid Clinic: 080-22111729";
    }
    if (selectedScenario.id === 2) {
      return "National Consumer Helpline (NCH): Toll-Free 1915 / e-Daakhil Online Filing Portal (edaakhil.nic.in)";
    }
    return "National Cyber Crime Helpline: 1930 / Online Reporting Portal: cybercrime.gov.in";
  };

  const handleHandoff = () => {
    if (!selectedScenario) return;
    
    // Create query reflecting the end of the simulation
    let contextStr = `I just finished the simulator scenario "${selectedScenario.title}" where I played as ${selectedScenario.character}. I scored ${score}/${maxScore}. `;
    contextStr += `I want to ask some specific legal questions about the ${selectedScenario.act} and how it applies to real life.`;
    
    onHandoffToChat("Tell me more about " + selectedScenario.act + " regarding " + selectedScenario.title, contextStr);
  };

  const activeNode = getActiveNode();

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden glass-panel">
      
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white shadow-md">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
              Legal Rights Simulator
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Choose Your Path
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Interactive Civic Rights Simulation</p>
          </div>
        </div>

        {gameState !== 'select' && (
          <button
            onClick={() => setGameState('select')}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            Quit Scenario
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-950/40">
        
        {/* SELECT STATE */}
        {gameState === 'select' && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h3 className="text-lg font-bold text-white">Choose a Legal Scenario</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Play through realistic scenarios based on Indian civic legislation. Earn points for correct legal actions, learn what consequences risky choices have, and unlock legal badges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((sc) => (
                <div 
                  key={sc.id}
                  className="p-5 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-800 hover:bg-slate-900/50 transition-all flex flex-col justify-between shadow-lg h-[240px] relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-600/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform"></div>
                  
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      {getScenarioIcon(sc.icon)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{sc.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sc.act}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                      {sc.description}
                    </p>
                  </div>

                  <button
                    onClick={() => startScenario(sc)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-primary-600 border border-primary-500 text-white hover:bg-primary-500 transition-all shadow-md active:scale-95"
                  >
                    Start Game <Play size={12} fill="white" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Disclaimer */}
            <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-900 bg-slate-950/60 flex gap-2.5 text-[10px] text-slate-500 leading-relaxed shadow">
              <HelpCircle className="shrink-0 text-slate-600 mt-0.5" size={14} />
              <div>
                <span className="font-bold text-slate-400 block mb-0.5">Education Disclaimer</span>
                These simulations represent general legal guidance based on Indian acts. They do not constitute formal legal advice. In real life, always consult a licensed lawyer or the District Legal Services Authority.
              </div>
            </div>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && selectedScenario && activeNode && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Status Header */}
            <div className="flex items-center justify-between gap-4 p-3 bg-slate-900/40 rounded-xl border border-slate-900 shadow">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Knowledge Progress:</span>
                <div className="w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${(parseInt(currentNodeId) - 1) * 25}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-300 font-bold">{currentNodeId} / 4</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award size={14} className="text-yellow-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Legal Points:</span>
                <span className="text-xs font-bold font-mono text-yellow-400">{score}</span>
              </div>
            </div>

            {/* Story text */}
            <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/20 glass-panel shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {getScenarioIcon(selectedScenario.icon)}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Character Role</span>
                  <p className="text-xs font-bold text-white leading-none">{selectedScenario.character}</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-900/80">
                {activeNode.story}
              </p>
            </div>

            {/* Decision choices */}
            {!stepResult ? (
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block px-1">What is your next move?</span>
                
                {Object.entries(activeNode.choices).map(([optionKey, text]) => (
                  <button
                    key={optionKey}
                    onClick={() => handleChoiceSelect(optionKey)}
                    disabled={submitting}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] ${
                      chosenOption === optionKey
                        ? 'bg-primary-950 border-primary-500 text-white shadow-lg'
                        : 'bg-slate-900/35 border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border shrink-0 ${
                      chosenOption === optionKey
                        ? 'bg-primary-500 border-primary-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      {optionKey}
                    </span>
                    <span className="text-xs leading-relaxed mt-0.5">{text as string}</span>
                    <ChevronRight size={14} className="ml-auto shrink-0 self-center text-slate-500" />
                  </button>
                ))}
              </div>
            ) : (
              /* Step response feedback */
              <div className="space-y-4 animate-fade-in-up">
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${getGradeColorClass(stepResult.grade)}`}>
                  <div className="shrink-0 mt-0.5">
                    {getGradeIcon(stepResult.grade)}
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold tracking-wider uppercase leading-none">
                        {getGradeText(stepResult.grade)}
                      </h4>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                        stepResult.score_delta > 0 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {stepResult.score_delta > 0 ? `+${stepResult.score_delta}` : stepResult.score_delta} Legal Points
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {stepResult.explanation}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] bg-slate-950/80 border border-slate-900/80 px-2.5 py-1.5 rounded-lg w-fit">
                      <ShieldCheck size={12} className="text-primary-400" />
                      <span className="text-slate-400">Legal Citation:</span>
                      <span className="font-bold text-slate-200">{stepResult.citation}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={advanceStep}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-primary-600 border border-primary-500 text-white hover:bg-primary-500 transition-all shadow-md active:scale-95"
                >
                  {currentNodeId === '4' ? 'See Final Results' : 'Proceed to Next Step'} <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        )}

        {/* END GAME STATE */}
        {gameState === 'end' && selectedScenario && (
          <div className="max-w-md mx-auto space-y-6 text-center animate-fade-in-up">
            
            {/* Badge Unlocked Card */}
            <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/20 glass-panel shadow-2xl space-y-4">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <Trophy size={42} />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Scenario Completed</span>
                <h3 className="text-lg font-black text-white">{selectedScenario.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Score: <span className="font-bold text-yellow-400">{score}</span> / {maxScore} points</p>
              </div>

              {/* Badge info */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900/80 text-center space-y-2">
                <span className="text-2xl block">{getBadgeDetails((score / maxScore) * 100).emoji}</span>
                <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                  Badge: {getBadgeDetails((score / maxScore) * 100).name}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                  {getBadgeDetails((score / maxScore) * 100).desc}
                </p>
              </div>
            </div>

            {/* DLSA Contact & Real Help */}
            <div className="p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 text-left space-y-2.5 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider leading-none">Need Real Assistance?</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If you or someone you know is facing a similar situation, please contact the official Legal Services Authority:
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 text-[10px] text-emerald-400 font-mono leading-relaxed">
                {getDLSAContact()}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleHandoff}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-600 to-accent-600 border border-primary-500 text-white hover:opacity-95 transition-all shadow-md active:scale-95"
              >
                <MessageSquare size={14} /> 💬 Ask LexAI Chat about this Act
              </button>

              <button
                onClick={() => startScenario(selectedScenario)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <RotateCcw size={12} /> Play Again
              </button>

              <button
                onClick={() => setGameState('select')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-transparent border border-transparent text-slate-500 hover:text-slate-300 transition-all"
              >
                Back to Scenario Selector
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
