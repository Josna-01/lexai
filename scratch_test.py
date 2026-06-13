from dotenv import load_dotenv
load_dotenv()
import sys
sys.path.insert(0, 'backend')
from foundry_retriever import FoundryRetriever

r = FoundryRetriever()

queries = [
    "salary not received by employee",
    "online fraud hacking cybercrime",
    "defective product refund consumer rights",
]

for q in queries:
    print(f"\n{'='*60}")
    print(f"QUERY: {q}")
    print('='*60)
    results = r.retrieve(q, match_count=3)
    for c in results:
        print(f"  ACT   : {c['act']}")
        print(f"  SCORE : {c['score']:.4f}")
        print(f"  SEC   : {c['section']} | {c['heading']}")
        print(f"  TEXT  : {c['content'][:120]}...")
        print()
