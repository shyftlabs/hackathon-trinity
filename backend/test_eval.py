"""Quick diagnostic test for the evaluate agent."""
import asyncio, os, sys, json
sys.path.insert(0, os.path.join('..', 'continuum', 'src'))
from dotenv import load_dotenv
load_dotenv('.env', override=True)

async def test():
    from synapse.agents.lifecycle import SynapseApp
    app = SynapseApp()
    await app.initialize()
    from synapse.agents.diagnostic import QUIZ_EVAL_INSTRUCTIONS, _extract_json

    agent = app.make_agent(
        name='test-evaluator',
        instructions=QUIZ_EVAL_INSTRUCTIONS,
        gateway_mode='strict',
        output_schema=None,
        max_turns=5,
        memory=False,
    )
    qa = json.dumps([
        {"question_id": "q1", "student_label": "A", "correct_label": "A"},
        {"question_id": "q2", "student_label": "B", "correct_label": "B"},
    ])
    prompt = f"Student ID: test-001\nTopics assessed: calculus\nQuiz results:\n{qa}\nProduce the KnowledgeMap JSON."

    response = await app.runner.run(agent=agent, input=prompt, user_id='test-001')
    print('STATUS:', response.status)
    print('CONTENT LEN:', len(response.content or ''))
    print('CONTENT:', (response.content or '')[:800])
    if response.error:
        print('ERROR:', response.error)
    await app.close()

asyncio.run(test())
