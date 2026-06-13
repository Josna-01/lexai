"""
Scenario data structures and decision trees for the Legal Rights Simulator.
"""

SCENARIOS = {
    1: {
        "id": 1,
        "title": "The Withheld Wages",
        "act": "Payment of Wages Act, 1936",
        "character": "Ravi, a factory worker in Mangaluru",
        "description": "Navigate a wage dispute where your employer has withheld your salary for 3 months.",
        "icon": "Factory",
        "start_node": "1",
        "nodes": {
            "1": {
                "id": "1",
                "story": "You're Ravi. You work at a textile factory in Mangaluru. Your employer has not paid your salary for 3 months. Today you ask him for your wages, and he dismisses you saying, 'Business is slow, come back next week.' You need this money for your rent and family expenses.",
                "choices": {
                    "A": {
                        "text": "Keep waiting. You don't want to make a fuss or risk losing your job.",
                        "score_delta": -10,
                        "next_node": "2",
                        "fallback_citation": "Section 5 & 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Waiting without taking action gives you no legal protection. Additionally, under the Limitation Act, legal claims for wage disputes must be filed within 3 years, or they expire."
                    },
                    "B": {
                        "text": "File a claim with the Labour Commissioner.",
                        "score_delta": 20,
                        "next_node": "2",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Correct move! Under the Payment of Wages Act, the Labour Commissioner acts as an Authority to hear claims regarding delayed/withheld wages and can order the employer to pay the wages plus a penalty of up to ten times that amount."
                    },
                    "C": {
                        "text": "Protest and block the factory gate.",
                        "score_delta": -5,
                        "next_node": "2",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Protesting without authorization can lead to counter-complaints by the employer for disrupting business or trespassing. It is safer to seek legal remedies through the Labour Commissioner."
                    },
                    "D": {
                        "text": "Go to the local police station to file a complaint.",
                        "score_delta": 5,
                        "next_node": "2",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "While you can try to file a complaint for cheating (Section 420 IPC/BNS equivalent), police usually redirect labor and wage disputes to the Labour Court or Commissioner, as they are civil/administrative matters."
                    }
                }
            },
            "2": {
                "id": "2",
                "story": "The factory manager finds out you are planning to take legal action. He calls you into his office and threatens to fire you immediately if you contact any government official. He demands that you sign a document stating you have received all your wages.",
                "choices": {
                    "A": {
                        "text": "Sign the document to keep your job.",
                        "score_delta": -15,
                        "next_node": "3",
                        "fallback_citation": "Section 23, Payment of Wages Act, 1936",
                        "fallback_explanation": "Signing a false receipt weakens your legal claim significantly. However, Section 23 of the Act states that any contract or agreement whereby an employee relinquishes their rights under the Act is null and void."
                    },
                    "B": {
                        "text": "Refuse to sign and record the audio of the threat secretly as evidence.",
                        "score_delta": 20,
                        "next_node": "3",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Excellent decision! Gathering evidence of employer coercion or threats is highly useful for hearings before the Labour Commissioner, and helps prove wrongful termination if they retaliate."
                    },
                    "C": {
                        "text": "Write an angry email back to the manager cc'ing all staff.",
                        "score_delta": 0,
                        "next_node": "3",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Sending aggressive group emails does not help legally and can sometimes be used by the employer to claim you violated company code of conduct."
                    },
                    "D": {
                        "text": "Resign immediately on the spot.",
                        "score_delta": -5,
                        "next_node": "3",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Resigning voluntarily makes it harder to claim wrongful termination, though you are still legally entitled to all unpaid wages for the months you worked."
                    }
                }
            },
            "3": {
                "id": "3",
                "story": "The manager realizes you won't back down. He offers a compromise: the factory will pay you 50% of your unpaid wages immediately, but only if you sign a waiver releasing them from any further legal claims.",
                "choices": {
                    "A": {
                        "text": "Sign the waiver and take the 50% cash.",
                        "score_delta": -10,
                        "next_node": "4",
                        "fallback_citation": "Section 23, Payment of Wages Act, 1936",
                        "fallback_explanation": "Taking less than what you earned under coercion is not legally required. The law protects your right to full wages. Any waiver relinquishing your rights under the Act is void under Section 23."
                    },
                    "B": {
                        "text": "Reject the offer, demanding 100% of your wages + compensation.",
                        "score_delta": 20,
                        "next_node": "4",
                        "fallback_citation": "Section 15(3), Payment of Wages Act, 1936",
                        "fallback_explanation": "Correct! Section 15(3) authorizes the commissioner to direct the payment of delayed wages together with the payment of such compensation as the authority may think fit."
                    },
                    "C": {
                        "text": "Ask your co-workers what they think you should do.",
                        "score_delta": 5,
                        "next_node": "4",
                        "fallback_citation": "Section 16, Payment of Wages Act, 1936",
                        "fallback_explanation": "Consulting colleagues is helpful. Under Section 16, employees of the same group can file a joint application before the Labour Commissioner, which increases leverage."
                    },
                    "D": {
                        "text": "File a lawsuit in the local civil court.",
                        "score_delta": 10,
                        "next_node": "4",
                        "fallback_citation": "Section 22, Payment of Wages Act, 1936",
                        "fallback_explanation": "While civil courts are an option, Section 22 of the Act bars regular civil suits for recovery of wages if a remedy can be sought before the Labour Authority, to keep proceedings cheap and fast for workers."
                    }
                }
            },
            "4": {
                "id": "4",
                "story": "The Labour Commissioner schedules a formal hearing. The factory manager brings a corporate lawyer, but you cannot afford representation. The hearing is about to begin.",
                "choices": {
                    "A": {
                        "text": "Do not show up for the hearing out of fear.",
                        "score_delta": -20,
                        "next_node": "5",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Failing to appear will result in the case being dismissed or decided ex-parte (in favor of the employer). Always show up, even without a lawyer."
                    },
                    "B": {
                        "text": "Contact the District Legal Services Authority (DLSA) for free representation.",
                        "score_delta": 20,
                        "next_node": "5",
                        "fallback_citation": "Section 12, Legal Services Authorities Act, 1987",
                        "fallback_explanation": "Perfect! Under Section 12 of the LSA Act, every industrial worker is entitled to free legal services from the state, regardless of their income level."
                    },
                    "C": {
                        "text": "Take a high-interest local loan to hire a private attorney.",
                        "score_delta": -10,
                        "next_node": "5",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Taking on debt is unnecessary because legal aid is a statutory right for industrial laborers in India, and the Labour Commission is designed to be accessible to self-represented workers."
                    },
                    "D": {
                        "text": "Represent yourself and present your bank statements and attendance registers.",
                        "score_delta": 10,
                        "next_node": "5",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Representing yourself is fully permitted, and presenting physical evidence like bank statements proving non-payment is highly effective in proving your case."
                    }
                }
            },
            "5": {
                "id": "5",
                "story": "Resolution. The Labour Commissioner rules in your favor, ordering the employer to pay your full wages plus ₹50,000 in compensation. However, the manager tells you he will delay the payment by appealing the decision.",
                "choices": {
                    "A": {
                        "text": "File an execution application in the Labour Court to enforce the order.",
                        "score_delta": 20,
                        "next_node": "end",
                        "fallback_citation": "Section 17, Payment of Wages Act, 1936",
                        "fallback_explanation": "Correct! If the employer refuses to comply with the order, you can file an execution application to recover the money as land revenue arrears or via attachment."
                    },
                    "B": {
                        "text": "Sit outside the factory on a hunger strike.",
                        "score_delta": 5,
                        "next_node": "end",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Protesting can raise social pressure but has no direct legal force to release the money ordered."
                    },
                    "C": {
                        "text": "Physically block the manager's car until he signs the cheque.",
                        "score_delta": -20,
                        "next_node": "end",
                        "fallback_citation": "Section 341, Indian Penal Code / BNS",
                        "fallback_explanation": "Illegal! Wrongful restraint is a criminal offense under the BNS/IPC. Doing this allows the employer to file criminal charges against you."
                    },
                    "D": {
                        "text": "Pay a fee to a collections agency to retrieve the cash.",
                        "score_delta": 0,
                        "next_node": "end",
                        "fallback_citation": "Section 15, Payment of Wages Act, 1936",
                        "fallback_explanation": "Using private collections agencies has no statutory standing under labor laws and can lead to illegal extortion charges."
                    }
                }
            }
        }
    },
    2: {
        "id": 2,
        "title": "The Defective Refund",
        "act": "Consumer Protection Act, 2019",
        "character": "Priya, an online shopper",
        "description": "Ordered a laptop for college online, but received a box of stones. Customer support refuses to refund.",
        "icon": "Laptop",
        "start_node": "1",
        "nodes": {
            "1": {
                "id": "1",
                "story": "You're Priya. You ordered a laptop online for college, costing ₹45,000. When you open the package, you find a couple of heavy stones instead of a laptop. You call customer service, but they claim, 'Our delivery records show the package weight was correct. No refund will be issued.'",
                "choices": {
                    "A": {
                        "text": "Accept the loss and buy a cheaper laptop.",
                        "score_delta": -10,
                        "next_node": "2",
                        "fallback_citation": "Section 2(9), Consumer Protection Act, 2019",
                        "fallback_explanation": "Giving up means relinquishing your 'Right to Seek Redressal'—a core consumer right protected under Section 2(9) of the Act against unfair trade practices."
                    },
                    "B": {
                        "text": "Draft a formal complaint showing unboxing video/photos, and send it to the seller.",
                        "score_delta": 20,
                        "next_node": "2",
                        "fallback_citation": "Section 2(47), Consumer Protection Act, 2019",
                        "fallback_explanation": "Great job! Establishing a paper trail with unboxing evidence is vital. Under the Act, delivering a defective or entirely different product constitutes a 'deficiency in service' and an 'unfair trade practice' under Section 2(47)."
                    },
                    "C": {
                        "text": "Post a viral thread complaining on social media.",
                        "score_delta": 5,
                        "next_node": "2",
                        "fallback_citation": "Section 2(9), Consumer Protection Act, 2019",
                        "fallback_explanation": "Social media callouts can pressure companies, but they do not constitute formal legal claims. You still need to file a formal complaint to guarantee recovery."
                    },
                    "D": {
                        "text": "File a police FIR for delivery theft.",
                        "score_delta": 10,
                        "next_node": "2",
                        "fallback_citation": "Section 420, Indian Penal Code / BNS",
                        "fallback_explanation": "While this involves elements of cheating or theft, police often treat it as a commercial dispute and direct you to Consumer Forum, though filing an online police grievance helps as evidence."
                    }
                }
            },
            "2": {
                "id": "2",
                "story": "Instead of resolving the issue, the e-commerce company blocks your account, accusing you of fraud and claiming they have blacklisted your IP address.",
                "choices": {
                    "A": {
                        "text": "File a grievance online with the National Consumer Helpline (NCH).",
                        "score_delta": 20,
                        "next_node": "3",
                        "fallback_citation": "Section 2(9), Consumer Protection Act, 2019",
                        "fallback_explanation": "Excellent! The National Consumer Helpline (NCH) is a government portal that acts as a pre-litigation mediator. They contact the e-commerce brand's nodal officers, resolving over 70% of cases without court intervention."
                    },
                    "B": {
                        "text": "Create fake accounts to spam their customer service representatives.",
                        "score_delta": -10,
                        "next_node": "3",
                        "fallback_citation": "Information Technology Act, 2000",
                        "fallback_explanation": "Creating fake profiles or spamming customer service can violate platform terms of service and muddy your legal case if the seller alleges harassment."
                    },
                    "C": {
                        "text": "Send a formal legal notice through registered post.",
                        "score_delta": 15,
                        "next_node": "3",
                        "fallback_citation": "Consumer Protection Act, 2019",
                        "fallback_explanation": "A legal notice issued to their registered office is a strong formal warning. It shows you are prepared to file a case in the Consumer Commission, which often prompts brands to settle."
                    },
                    "D": {
                        "text": "Contact your bank to raise a payment chargeback/dispute.",
                        "score_delta": 15,
                        "next_node": "3",
                        "fallback_citation": "RBI Fair Practices Code",
                        "fallback_explanation": "Smart administrative move! Disputing the charge with your credit card or bank under 'goods not received' can freeze the transaction while an investigation is pending."
                    }
                }
            },
            "3": {
                "id": "3",
                "story": "The company's legal department replies to your legal notice by threatening a multi-crore defamation lawsuit against you if you do not delete your social media posts regarding the incident.",
                "choices": {
                    "A": {
                        "text": "Delete all posts out of fear and apologize.",
                        "score_delta": -15,
                        "next_node": "4",
                        "fallback_citation": "Constitution of India, Article 19(1)(a)",
                        "fallback_explanation": "Backing down is unnecessary. Truth is an absolute defense in defamation. Sharing an honest, factual account of your customer experience is protected under free speech, and threats of litigation are commonly used to scare consumers."
                    },
                    "B": {
                        "text": "Ignore their threat and proceed with filing a consumer case.",
                        "score_delta": 20,
                        "next_node": "4",
                        "fallback_citation": "Section 39, Consumer Protection Act, 2019",
                        "fallback_explanation": "Correct. Consumer Protection Act protects consumer complaints from retaliatory defamation threats as long as the statements made are true and form part of a legal dispute."
                    },
                    "C": {
                        "text": "Start an online public petition on Change.org.",
                        "score_delta": 0,
                        "next_node": "4",
                        "fallback_citation": "Consumer Protection Act, 2019",
                        "fallback_explanation": "Online petitions raise awareness but have no binding legal authority. A consumer forum filing is required for a mandatory refund order."
                    },
                    "D": {
                        "text": "Consult the DLSA/Legal Aid Clinic regarding the defamation threat.",
                        "score_delta": 20,
                        "next_node": "4",
                        "fallback_citation": "Section 12, Legal Services Authorities Act, 1987",
                        "fallback_explanation": "Very smart. Free legal clinics can review the threat and assure you that it is an empty threat, giving you the confidence to fight the case."
                    }
                }
            },
            "4": {
                "id": "4",
                "story": "You decide to file a formal case online using the government's e-Daakhil portal. However, you are confused about which Consumer Commission has the authority to handle your ₹45,000 claim.",
                "choices": {
                    "A": {
                        "text": "File the case in the National Consumer Disputes Redressal Commission.",
                        "score_delta": -5,
                        "next_node": "5",
                        "fallback_citation": "Section 58, Consumer Protection Act, 2019",
                        "fallback_explanation": "Incorrect. The National Commission only handles cases exceeding ₹10 Crore under the 2019 Act (recently revised to ₹2 Crore). Your small claim will be dismissed on jurisdictional grounds."
                    },
                    "B": {
                        "text": "File the case in the District Consumer Commission.",
                        "score_delta": 20,
                        "next_node": "5",
                        "fallback_citation": "Section 34, Consumer Protection Act, 2019",
                        "fallback_explanation": "Correct! The District Commission has jurisdiction over complaints where the value of goods or services paid does not exceed ₹50 Lakhs. You can file this online yourself via e-Daakhil."
                    },
                    "C": {
                        "text": "File the case in the State Consumer Commission.",
                        "score_delta": 5,
                        "next_node": "5",
                        "fallback_citation": "Section 47, Consumer Protection Act, 2019",
                        "fallback_explanation": "Incorrect. The State Commission handles cases between ₹50 Lakhs and ₹2 Crore. It only hears appeals for smaller values, so you must start in the District Commission."
                    },
                    "D": {
                        "text": "File a petition directly in the Supreme Court of India.",
                        "score_delta": -15,
                        "next_node": "5",
                        "fallback_citation": "Consumer Protection Act, 2019",
                        "fallback_explanation": "Incorrect. You must follow the statutory hierarchy. The Supreme Court will not entertain a basic defective product complaint directly, and will dismiss it with costs."
                    }
                }
            },
            "5": {
                "id": "5",
                "story": "Resolution. The District Consumer Commission orders the online seller to refund your ₹45,000, pay ₹10,000 as compensation for mental harassment, and ₹5,000 as litigation costs. The seller ignores the order.",
                "choices": {
                    "A": {
                        "text": "File an execution application under Section 72 of the Consumer Protection Act, 2019.",
                        "score_delta": 20,
                        "next_node": "end",
                        "fallback_citation": "Section 72, Consumer Protection Act, 2019",
                        "fallback_explanation": "Correct! Section 72 empowers the Commission to punish non-compliance with imprisonment up to 3 years or a fine up to ₹1 Lakh, which quickly forces compliance."
                    },
                    "B": {
                        "text": "Write a public review calling the CEO a thief and liar.",
                        "score_delta": -15,
                        "next_node": "end",
                        "fallback_citation": "Section 499, IPC / BNS",
                        "fallback_explanation": "Defamatory terms like 'thief' can trigger civil or criminal defamation suits. Defamation threats are highly disruptive to consumer recovery."
                    },
                    "C": {
                        "text": "File another fresh complaint about the non-payment.",
                        "score_delta": 5,
                        "next_node": "end",
                        "fallback_citation": "Section 72, Consumer Protection Act, 2019",
                        "fallback_explanation": "Filing a new complaint is redundant. You must execute the order you already won rather than starting the process over."
                    },
                    "D": {
                        "text": "Wait for the company nodal officers to contact you.",
                        "score_delta": 0,
                        "next_node": "end",
                        "fallback_citation": "Section 72, Consumer Protection Act, 2019",
                        "fallback_explanation": "Waiting without initiating execution means the order stays unfulfilled indefinitely."
                    }
                }
            }
        }
    },
    3: {
        "id": 3,
        "title": "The Cyber Harassment",
        "act": "Information Technology Act, 2000",
        "character": "Aisha, a college student",
        "description": "Morphed photos are uploaded on a social media profile without your consent. Navigate reporting and removal.",
        "icon": "ShieldAlert",
        "start_node": "1",
        "nodes": {
            "1": {
                "id": "1",
                "story": "You're Aisha, a college student. You discover that a fake Instagram page has uploaded morphed, private photos of you, accompanied by derogatory comments. The page is gaining followers in your college group. You are panic-stricken.",
                "choices": {
                    "A": {
                        "text": "Delete all your social media accounts and hide in your room.",
                        "score_delta": -10,
                        "next_node": "2",
                        "fallback_citation": "Section 66E & 67, Information Technology Act, 2000",
                        "fallback_explanation": "Hiding does not stop the distribution. Morphing private photos and uploading them without consent violates Section 66E (privacy violation) and Section 67 (transmitting obscene material) of the IT Act. Active reporting is necessary."
                    },
                    "B": {
                        "text": "Take screenshots, record the page URL, and report the account on Instagram.",
                        "score_delta": 20,
                        "next_node": "2",
                        "fallback_citation": "Section 66E & 67, IT Act, 2000",
                        "fallback_explanation": "Excellent first step! Collecting digital evidence (screenshot + exact profile URL) is critical for cybercrime units, while reporting the profile initiates platform safety protocols."
                    },
                    "C": {
                        "text": "Message the account to argue and threaten them.",
                        "score_delta": -5,
                        "next_node": "2",
                        "fallback_citation": "Information Technology Act, 2000",
                        "fallback_explanation": "Arguing with anonymous accounts rarely works and alert them to delete the account before you capture evidence, letting them escape prosecution."
                    },
                    "D": {
                        "text": "Report the matter to your college principal.",
                        "score_delta": 5,
                        "next_node": "2",
                        "fallback_citation": "IT Act, 2000",
                        "fallback_explanation": "Reporting to the principal can help on a disciplinary level if the culprit is a student, but they do not have the legal authority to remove the images or arrest the perpetrator."
                    }
                }
            },
            "2": {
                "id": "2",
                "story": "Instagram's automated support replies that the page does not violate their community guidelines and refuses to take it down. The photos are still circulating.",
                "choices": {
                    "A": {
                        "text": "File an official complaint on the National Cyber Crime Reporting Portal.",
                        "score_delta": 20,
                        "next_node": "3",
                        "fallback_citation": "Section 79, IT Act, 2000",
                        "fallback_explanation": "Correct! Filing on cybercrime.gov.in directs the complaint to the local cyber cell. Under IT Rules, once a government authority or victim reports sexual harassment/morphed images, platforms must remove it within 24 hours under Section 79."
                    },
                    "B": {
                        "text": "Ask all your friends to mass-report the page.",
                        "score_delta": 5,
                        "next_node": "3",
                        "fallback_citation": "IT Act, 2000",
                        "fallback_explanation": "Mass-reporting can trigger automated takedowns, but it does not lead to investigation or finding the culprit. A formal cybercell complaint is required for prosecution."
                    },
                    "C": {
                        "text": "Pay a private online hacker service to take down the account.",
                        "score_delta": -15,
                        "next_node": "3",
                        "fallback_citation": "Section 66, Information Technology Act, 2000",
                        "fallback_explanation": "Illegal! Hiring an unauthorized hacker to break into a server is a crime under Section 66 of the IT Act (computer related offenses), exposing you to criminal liability."
                    },
                    "D": {
                        "text": "Go to the local police station to file a complaint under Section 66E and 67.",
                        "score_delta": 20,
                        "next_node": "3",
                        "fallback_citation": "Section 66E & 67, IT Act, 2000",
                        "fallback_explanation": "Excellent decision. Going to the police or a Cyber Crime police station is a direct route to register an FIR for violation of privacy and dissemination of obscene content."
                    }
                }
            },
            "3": {
                "id": "3",
                "story": "You go to the local police station, but the duty officer is dismissive. He says, 'It's just a college prank, you kids shouldn't put photos online. Just delete your accounts, we can't file an FIR for this.'",
                "choices": {
                    "A": {
                        "text": "Accept what he says, feel ashamed, and go home.",
                        "score_delta": -20,
                        "next_node": "4",
                        "fallback_citation": "Section 154, Code of Criminal Procedure (CrPC/BNSS)",
                        "fallback_explanation": "Giving up is not necessary. Under Section 154 of CrPC, police are legally bound to register an FIR for cognizable cyber crimes. Non-registration of FIR for sexual/privacy crimes is a serious duty failure."
                    },
                    "B": {
                        "text": "Submit a written complaint to the Superintendent of Police (SP) or Cyber Crime Unit.",
                        "score_delta": 20,
                        "next_node": "4",
                        "fallback_citation": "Section 154(3), CrPC (Section 173 BNSS)",
                        "fallback_explanation": "Excellent! Under Section 154(3) CrPC, if a local station officer refuses to file an FIR, you can write directly to the SP, who can order an investigation or investigate the matter themselves."
                    },
                    "C": {
                        "text": "Post a tweet tags the police department calling them out.",
                        "score_delta": 5,
                        "next_node": "4",
                        "fallback_citation": "IT Act, 2000",
                        "fallback_explanation": "Tagging senior police officials on Twitter often leads to immediate media cell responses and commands to local stations, but it should be accompanied by a formal written complaint."
                    },
                    "D": {
                        "text": "Contact DLSA to request free legal representation and protection.",
                        "score_delta": 20,
                        "next_node": "4",
                        "fallback_citation": "Section 12, Legal Services Authorities Act, 1987",
                        "fallback_explanation": "Great job. DLSA panel lawyers can escort victims to police stations to ensure FIR registration and represent victims free of charge in cyber harassment matters."
                    }
                }
            },
            "4": {
                "id": "4",
                "story": "Through the Cyber Cell investigation, the IP address is traced, and the culprit is identified. It is a 17-year-old classmate. Aisha wonders how the criminal justice system handles him.",
                "choices": {
                    "A": {
                        "text": "Demand he be locked up in an adult prison with hardened criminals.",
                        "score_delta": -5,
                        "next_node": "5",
                        "fallback_citation": "Section 15, Juvenile Justice Act, 2015",
                        "fallback_explanation": "Under the Juvenile Justice Act, minors under 18 cannot be kept in regular adult jails. They are processed through a Juvenile Justice Board and sent to Observation Homes to prioritize rehabilitation."
                    },
                    "B": {
                        "text": "Proceed with the case in front of the Juvenile Justice Board.",
                        "score_delta": 20,
                        "next_node": "5",
                        "fallback_citation": "Section 15, Juvenile Justice Act, 2015",
                        "fallback_explanation": "Correct! As a 17-year-old, he will be tried by the Juvenile Justice Board. He can face reformative sentences, community service, or detention in a special home for up to 3 years."
                    },
                    "C": {
                        "text": "Gather friends to beat him up or threaten him at college.",
                        "score_delta": -20,
                        "next_node": "5",
                        "fallback_citation": "Indian Penal Code / BNS",
                        "fallback_explanation": "Extremely risky and illegal. Assaulting or threatening the minor makes you a perpetrator of violence, and the offender's family can file counter-assault charges against you."
                    },
                    "D": {
                        "text": "File a civil lawsuit for monetary compensation against his parents.",
                        "score_delta": 10,
                        "next_node": "5",
                        "fallback_citation": "Law of Torts",
                        "fallback_explanation": "You can file a civil suit for damages/defamation against the minor represented by his guardians. While legal, this takes years in civil courts compared to quick reformative action under the JJ Act."
                    }
                }
            },
            "5": {
                "id": "5",
                "story": "Resolution. The Juvenile Justice Board places the classmate under probation for 1 year and orders him and his parents to delete all digital materials and write a formal apology. However, you notice someone has re-uploaded the morphed photos on another profile.",
                "choices": {
                    "A": {
                        "text": "Submit a takedown request to Instagram's grievance officer under IT Rules 2021.",
                        "score_delta": 20,
                        "next_node": "end",
                        "fallback_citation": "Rule 3(2)(b), IT Rules, 2021",
                        "fallback_explanation": "Correct! Under Rule 3(2)(b) of the IT Rules, social media platforms are legally mandated to remove non-consensual sexual/morphed content within 24 hours of receiving a complaint."
                    },
                    "B": {
                        "text": "Re-share the photos yourself to warn others about the leak.",
                        "score_delta": -20,
                        "next_node": "end",
                        "fallback_citation": "Section 67, Information Technology Act, 2000",
                        "fallback_explanation": "Extremely illegal. Transmitting or publishing sexually explicit content, even for warning purposes, is a punishable offense under Section 67."
                    },
                    "C": {
                        "text": "Try to find out who the new anonymous poster is on your own.",
                        "score_delta": 5,
                        "next_node": "end",
                        "fallback_citation": "Information Technology Act, 2000",
                        "fallback_explanation": "Tracking anonymous accounts without police cyber tools is extremely difficult and slows down the removal of the images."
                    },
                    "D": {
                        "text": "Message the poster begging them to delete it.",
                        "score_delta": 0,
                        "next_node": "end",
                        "fallback_citation": "Information Technology Act, 2000",
                        "fallback_explanation": "Begging the poster has no legal backing and is rarely effective against malicious cyber harassers."
                    }
                }
            }
        }
    }
}
