"""Test evaluate with memory=True (same as FastAPI path)."""
import asyncio, os, sys, json
sys.path.insert(0, os.path.join('..', 'continuum', 'src'))
from dotenv import load_dotenv
load_dotenv('.env', override=True)

async def test():
    from synapse.agents.lifecycle import SynapseApp
    from synapse.agents.diagnostic import evaluate_quiz
    app = SynapseApp()
    await app.initialize()

    qa_pairs = [
        {"question_id": "q1", "student_label": "A", "correct_label": "A"},
        {"question_id": "q2", "student_label": "B", "correct_label": "B"},
    ]
    try:
        result = await evaluate_quiz(app, "test-001", ["calculus"], qa_pairs)
        print("SUCCESS:", result.model_dump())
    except Exception as e:
        print("FAILED:", e)
    await app.close()

asyncio.run(test())
