# simulator_scenarios.py

"""Category scenario pool for LexAI Rights Simulator.
Each category maps to a list of scenario dicts.
"""

import random

CATEGORY_SCENARIOS = {
    "Wage Rights": [
        {
            "title": "Delayed Salary Claim",
            "act": "Payment of Wages Act, 1936",
            "character": "Aarav, software engineer in Bangalore",
            "nodes": {
                "1": {
                    "story": "Aarav works in an IT company in Bangalore. His employer has delayed his salary for 3 months, citing 'cash flow issues'. How should he start?",
                    "choices": {
                        "A": "Wait silently and hope the employer pays eventually.",
                        "B": "Send a formal written notice demanding full salary.",
                        "C": "Quit immediately without demanding wages.",
                        "D": "Abuse the manager on a company-wide email."
                    }
                },
                "2": {
                    "story": "The employer ignores the formal notice and stops replying to Aarav's emails. The HR team refuses to meet him.",
                    "choices": {
                        "A": "Protest outside the office gates blocking entry.",
                        "B": "Accept the situation and start looking for another job silently.",
                        "C": "Send a final legal notice through an advocate.",
                        "D": "Steal company laptops to recover the money."
                    }
                },
                "3": {
                    "story": "After receiving the legal notice, the employer offers to settle immediately, but only for 30% of the total pending amount, demanding Aarav sign a waiver.",
                    "choices": {
                        "A": "Reject the unfair offer and insist on full legal redressal.",
                        "B": "Accept the 30% to avoid legal hassle.",
                        "C": "Sign the waiver but plan to sue them anyway later.",
                        "D": "Threaten the HR director personally over a phone call."
                    }
                },
                "4": {
                    "story": "The negotiations fail. Aarav must now choose the correct legal forum to file his claim for unpaid wages.",
                    "choices": {
                        "A": "File a petition directly in the Supreme Court of India.",
                        "B": "File a complaint with the Labour Commissioner or local Labour Court.",
                        "C": "Complain to the local police station.",
                        "D": "Post a viral video on YouTube."
                    }
                },
                "5": {
                    "story": "The Labour Court rules in Aarav's favor, ordering the company to pay the full amount with interest. The company is delaying the payment.",
                    "choices": {
                        "A": "File an execution petition in the court to enforce the order.",
                        "B": "Wait indefinitely for them to pay.",
                        "C": "Hire private goons to recover the money.",
                        "D": "Start a hunger strike outside the CEO's house."
                    }
                }
            }
        }
    ],
    "Consumer Refunds": [
        {
            "title": "Defective Phone Refund",
            "act": "Consumer Protection Act, 2019",
            "character": "Rohit, online shopper in Pune",
            "nodes": {
                "1": {
                    "story": "Rohit bought a new smartphone online, but the screen was cracked on arrival. He contacts customer care.",
                    "choices": {
                        "A": "File a formal return/replacement request on the platform immediately.",
                        "B": "Accept the defective phone and pay for repair from a local shop.",
                        "C": "Post a negative review online and defame the CEO.",
                        "D": "Ignore the issue and buy another phone."
                    }
                },
                "2": {
                    "story": "The platform rejects the return request, claiming the damage was done after delivery. They close the ticket.",
                    "choices": {
                        "A": "Threaten the delivery boy who brought the package.",
                        "B": "File a grievance online with the National Consumer Helpline (NCH).",
                        "C": "Accept the loss since the ticket is closed.",
                        "D": "Go to the company's local warehouse and demand a new phone."
                    }
                },
                "3": {
                    "story": "The NCH attempts pre-litigation mediation. The company offers a 10% discount coupon for his next purchase instead of a refund.",
                    "choices": {
                        "A": "Accept the coupon and drop the matter.",
                        "B": "Reject the coupon and demand a full refund or replacement.",
                        "C": "Use the coupon and then file a lawsuit.",
                        "D": "Hack the platform's website in retaliation."
                    }
                },
                "4": {
                    "story": "Mediation fails. Rohit decides to take formal legal action for 'deficiency of service'.",
                    "choices": {
                        "A": "File a complaint with the District Consumer Disputes Redressal Commission.",
                        "B": "File a criminal FIR for fraud at the local police station.",
                        "C": "Appeal to the High Court directly.",
                        "D": "Write an open letter to the Prime Minister."
                    }
                },
                "5": {
                    "story": "The Consumer Commission orders the company to refund the amount and pay compensation. The company doesn't comply within the 30-day window.",
                    "choices": {
                        "A": "File an application under Section 71 for execution of the order.",
                        "B": "Give up, assuming courts are powerless.",
                        "C": "Vandalize the company's local office.",
                        "D": "Spam their customer care continuously."
                    }
                }
            }
        }
    ],
    "Cybercrime": [
        {
            "title": "UPI Phishing Attack",
            "act": "Information Technology Act, 2000",
            "character": "Anita, retired officer in Chennai",
            "nodes": {
                "1": {
                    "story": "Anita receives a message claiming she won a lottery, with a UPI request link to pay a small processing fee.",
                    "choices": {
                        "A": "Transfer the processing fee to claim the lottery.",
                        "B": "Ignore the message entirely and do nothing.",
                        "C": "Take a screenshot, block the sender, and report the number as spam.",
                        "D": "Reply to the message with personal banking details."
                    }
                },
                "2": {
                    "story": "Unfortunately, Anita clicked the link before realizing, and ₹50,000 was deducted from her account.",
                    "choices": {
                        "A": "Call the scammer and beg for the money back.",
                        "B": "Call the bank's emergency helpline immediately to freeze the account.",
                        "C": "Wait for a few days to see if the money returns automatically.",
                        "D": "Delete the SMS to hide the mistake from her family."
                    }
                },
                "3": {
                    "story": "The bank freezes the account, but the transaction has already gone through. The bank asks her to file a formal complaint.",
                    "choices": {
                        "A": "File a complaint on the National Cyber Crime Reporting Portal (cybercrime.gov.in).",
                        "B": "Give up because the money is already gone.",
                        "C": "Hire a private hacker to trace the scammer.",
                        "D": "Blame the bank manager and create a scene at the branch."
                    }
                },
                "4": {
                    "story": "The cyber police register the complaint and start an investigation. The bank, however, refuses to reverse the transaction, claiming customer negligence.",
                    "choices": {
                        "A": "Accept the bank's decision and drop the issue.",
                        "B": "File a complaint with the RBI Banking Ombudsman.",
                        "C": "Send threatening emails to the bank CEO.",
                        "D": "File a civil suit against the telecom operator."
                    }
                },
                "5": {
                    "story": "The RBI Ombudsman reviews the case. Since Anita reported it within 3 days, RBI guidelines offer some protection, but she must cooperate with the ongoing cyber investigation.",
                    "choices": {
                        "A": "Provide all requested evidence and follow up regularly with the cyber cell.",
                        "B": "Refuse to cooperate further, expecting the Ombudsman to handle everything.",
                        "C": "Attempt to contact the scammer directly to negotiate.",
                        "D": "Withdraw all remaining funds and close the bank account in panic."
                    }
                }
            }
        }
    ],
    "Tenant Rights": [
        {
            "title": "Arbitrary Eviction Threat",
            "act": "Rent Control Act / Model Tenancy Act",
            "character": "Vikram, tenant in Delhi",
            "nodes": {
                "1": {
                    "story": "Vikram's landlord in Delhi wants him to vacate the flat within 2 days to rent it to someone else, despite a valid 11-month lease.",
                    "choices": {
                        "A": "Pack up and leave within 2 days to avoid conflict.",
                        "B": "Refuse arbitrary eviction and demand a proper written notice as per the lease.",
                        "C": "Stop paying rent entirely as a protest.",
                        "D": "Change the locks and refuse to speak to the landlord."
                    }
                },
                "2": {
                    "story": "The landlord gets angry and cuts off the electricity and water supply to the apartment to force Vikram out.",
                    "choices": {
                        "A": "Surrender and vacate the property immediately.",
                        "B": "File a police complaint and approach the Rent Authority for restoration of essential services.",
                        "C": "Break into the utility room and reconnect the supply forcibly.",
                        "D": "Hire local musclemen to threaten the landlord."
                    }
                },
                "3": {
                    "story": "The police warn the landlord, and water is restored. The landlord now sends a backdated legal notice claiming Vikram breached the contract by being 'noisy'.",
                    "choices": {
                        "A": "Ignore the false notice since he knows he wasn't noisy.",
                        "B": "Reply to the legal notice through an advocate denying the false allegations.",
                        "C": "Retaliate by actually playing loud music all night.",
                        "D": "Sign an apology letter to appease the landlord."
                    }
                },
                "4": {
                    "story": "The landlord files an eviction petition in the Rent Court based on the false nuisance claims.",
                    "choices": {
                        "A": "Flee the city and abandon his belongings.",
                        "B": "Appear in the Rent Court with evidence (e.g., neighbor testimonies) proving the claims are false.",
                        "C": "Bribe the court clerk to lose the case file.",
                        "D": "Don't show up to court, hoping the case gets dismissed."
                    }
                },
                "5": {
                    "story": "The court dismisses the landlord's petition and affirms Vikram's right to stay till the lease ends. The landlord continues to harass Vikram verbally.",
                    "choices": {
                        "A": "File an injunction suit against the landlord for peaceful possession.",
                        "B": "Physically assault the landlord the next time he visits.",
                        "C": "Stop paying rent for the remainder of the lease.",
                        "D": "Endure the verbal abuse silently until the lease ends."
                    }
                }
            }
        }
    ],
    "Women Safety": [
        {
            "title": "Workplace Hostility",
            "act": "PoSH Act, 2013",
            "character": "Tanvi, marketing lead in Gurugram",
            "nodes": {
                "1": {
                    "story": "Tanvi faces continuous inappropriate comments and hostile remarks from her manager. The manager also hints that her promotion depends on 'being extra friendly'.",
                    "choices": {
                        "A": "Resign from the job to find a peaceful workplace.",
                        "B": "Submit a formal written complaint to the company's Internal Complaints Committee (ICC).",
                        "C": "Confront the manager publicly in front of clients.",
                        "D": "Ignore the comments and hope he stops."
                    }
                },
                "2": {
                    "story": "Before Tanvi submits her complaint, the manager gets suspicious and threatens to give her a poor performance review if she complains to HR.",
                    "choices": {
                        "A": "Back down and don't file the complaint.",
                        "B": "Document the threat and include it as retaliation in her ICC complaint.",
                        "C": "Leak confidential company documents in revenge.",
                        "D": "Transfer to another department without reporting the issue."
                    }
                },
                "3": {
                    "story": "Tanvi submits the complaint. The ICC calls her for a conciliation meeting, asking if she wants to settle the matter informally with an apology from the manager.",
                    "choices": {
                        "A": "Accept the apology and withdraw the complaint immediately.",
                        "B": "Refuse conciliation and demand a formal inquiry into his behavior.",
                        "C": "Record the conciliation meeting secretly and post it online.",
                        "D": "Demand a large cash settlement from the manager to drop the case."
                    }
                },
                "4": {
                    "story": "The formal inquiry begins. The ICC asks Tanvi for evidence or witnesses to corroborate her claims.",
                    "choices": {
                        "A": "Provide emails, chat records, and names of colleagues who witnessed the behavior.",
                        "B": "Refuse to provide evidence, stating her word should be enough.",
                        "C": "Forge fake chat screenshots to make her case stronger.",
                        "D": "Withdraw the complaint because gathering evidence is stressful."
                    }
                },
                "5": {
                    "story": "The ICC finds the manager guilty and recommends strict disciplinary action. However, the company's CEO decides to just give the manager a 'verbal warning' and close the matter.",
                    "choices": {
                        "A": "Accept the CEO's decision and try to move on.",
                        "B": "File an appeal with the Appellate Authority/Local Court or file an FIR under IPC Section 354A.",
                        "C": "Hire goons to beat up the manager outside the office.",
                        "D": "Send an angry email to all employees and quit."
                    }
                }
            }
        }
    ],
    "Police Rights": [
        {
            "title": "Illegal Arrest Threat",
            "act": "Code of Criminal Procedure, 1973",
            "character": "Amit, citizen in Ahmedabad",
            "nodes": {
                "1": {
                    "story": "Amit is stopped by a police officer who threatens to arrest him for a minor verbal argument (a non-cognizable offense) unless Amit pays a ₹5,000 cash bribe.",
                    "choices": {
                        "A": "Pay the bribe immediately to avoid arrest and jail.",
                        "B": "Refuse the bribe and ask the officer to state the grounds of arrest.",
                        "C": "Physically push the officer and run away.",
                        "D": "Start crying and beg for forgiveness."
                    }
                },
                "2": {
                    "story": "The officer gets aggressive and says he doesn't need a warrant. He grabs Amit by the collar.",
                    "choices": {
                        "A": "Hit the officer back in self-defense.",
                        "B": "Stay calm, remind the officer of his rights, and ask someone to record the interaction.",
                        "C": "Offer ₹10,000 to let him go.",
                        "D": "Flee the scene immediately."
                    }
                },
                "3": {
                    "story": "The officer detains Amit and takes him to the police station without officially registering an FIR or an arrest memo.",
                    "choices": {
                        "A": "Demand to inform a friend or relative and ask for a lawyer.",
                        "B": "Sign whatever blank documents they give him to get out faster.",
                        "C": "Confess to crimes he didn't commit to appease them.",
                        "D": "Attempt to escape from the police station."
                    }
                },
                "4": {
                    "story": "Amit is held overnight for over 24 hours without being produced before a magistrate.",
                    "choices": {
                        "A": "Wait patiently indefinitely.",
                        "B": "Have his lawyer file a Habeas Corpus petition in the High Court.",
                        "C": "Bribe the station house officer (SHO).",
                        "D": "Start a hunger strike in the lockup."
                    }
                },
                "5": {
                    "story": "The court orders Amit's immediate release, noting the illegal detention. Amit wants to hold the officers accountable.",
                    "choices": {
                        "A": "Forget the incident and move on with life.",
                        "B": "File a complaint with the State Police Complaints Authority (SPCA) or the Human Rights Commission.",
                        "C": "Gather a mob to attack the police station.",
                        "D": "Stalk the officer to take personal revenge."
                    }
                }
            }
        }
    ]
}

def get_random_scenario(category: str):
    """Return a random scenario dict for the given category.
    Raises KeyError if the category does not exist.
    """
    scenarios = CATEGORY_SCENARIOS[category]
    return random.choice(scenarios)
