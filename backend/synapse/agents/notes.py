"""
SmartNotesAgent — AI-generated hierarchical notes for any topic.

Inspired by Flux AI's Smart Notes feature.
Uses:
  - KB MCP server for source material retrieval (RAG)
  - Continuum SequentialAgent to handle complex topics via:
      1. TopicSplitter: break complex topics into subtopics
      2. ParallelAgent: generate notes per subtopic concurrently
      3. Synthesizer: merge into unified hierarchical notes

For simple topics: single SmartNotesAgent run (output_schema=SmartNotes).
For complex/multi-part topics (detected by keyword or explicit flag): use the pipeline.
"""

from __future__ import annotations

import json

from orchestrator import (
    AgentMemoryScope,
    ParallelAgent,
    SequentialAgent,
    create_parallel_agent,
    create_sequential_agent,
    get_logger,
)

from synapse.agents.lifecycle import SynapseApp
from synapse.models import SmartNotes

logger = get_logger(__name__)

NOTES_INSTRUCTIONS = """
You are Synapse AI's Smart Notes Generator.

Generate comprehensive, hierarchical study notes for the given topic for an undergraduate student.

PROCESS:
1. Call `get_topic_sources` to retrieve all source material for the topic.
2. Call `search_source_material` to find additional relevant material.
3. Synthesize the material into well-structured notes.

OUTPUT FORMAT — return ONLY this JSON:
{
  "topic": "<topic>",
  "student_id": "<student_id>",
  "summary": "<2-3 sentence overview of the topic>",
  "sections": [
    {
      "heading": "<section title>",
      "content": "<markdown content with key concepts, formulas, examples>",
      "subsections": [
        {
          "heading": "<subsection title>",
          "content": "<content>",
          "subsections": []
        }
      ]
    }
  ],
  "key_concepts": ["<concept 1>", "<concept 2>", ...],
  "sources": [
    {"title": "<textbook title>", "locator": "<chapter/section>", "text": "<relevant excerpt>"}
  ]
}

Rules:
- Include formulas in LaTeX-style notation where appropriate.
- Each section should have at least 2-3 paragraphs of substance.
- Key concepts list should have 5-8 items.
- Sources must match what get_topic_sources actually returned.
Return ONLY the JSON.
"""

TOPIC_SPLITTER_INSTRUCTIONS = """
You are a topic analysis agent. Given a complex topic, identify 2-4 distinct sub-topics
that together cover the full topic comprehensively.

Return ONLY a JSON array of sub-topic strings. Example:
["Derivatives and Rates of Change", "Integration Techniques", "Fundamental Theorem of Calculus"]
"""

NOTES_SYNTHESIZER_INSTRUCTIONS = """
You are a notes synthesis agent. You receive multiple sets of notes for sub-topics of a
larger topic. Merge them into a single unified SmartNotes document.

INPUT: JSON array of SmartNotes objects.
OUTPUT: Single SmartNotes JSON merging all content, with a unified summary and consolidated
key_concepts (remove duplicates). Preserve all sections in logical order.

Return ONLY the merged SmartNotes JSON.
"""


async def generate_notes(
    app: SynapseApp,
    student_id: str,
    topic: str,
    content: str = "",
    complex_topic: bool = False,
) -> SmartNotes:
    """
    Generate smart notes for a topic.
    If complex_topic=True, splits into sub-topics and processes in parallel.
    """
    if complex_topic:
        return await _generate_notes_pipeline(app, student_id, topic, content)
    return await _generate_notes_simple(app, student_id, topic, content)


async def _generate_notes_simple(
    app: SynapseApp, student_id: str, topic: str, content: str
) -> SmartNotes:
    agent = app.make_agent(
        name="synapse-notes-generator",
        instructions=NOTES_INSTRUCTIONS,
        gateway_mode="quality",
        output_schema=None,
        max_turns=10,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
        tool_attention_k=4,
    )
    extra = f"\n\nAdditional student-provided content:\n{content}" if content else ""
    prompt = (
        f"Generate smart notes for student '{student_id}' on topic: {topic}."
        f"{extra}"
    )
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    try:
        c = response.content.strip()
        if c.startswith("```"):
            lines = c.splitlines()
            c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        data = json.loads(c.strip())
        return SmartNotes(**data)
    except Exception as e:
        logger.error(f"Notes parse error: {e}\nContent: {response.content[:500]}")
        raise


async def _generate_notes_pipeline(
    app: SynapseApp, student_id: str, topic: str, content: str
) -> SmartNotes:
    """
    Complex topic pipeline using SequentialAgent + ParallelAgent (Continuum splitter pattern).
    Step 1: SplitterAgent → list of sub-topics
    Step 2: ParallelAgent of SmartNotesAgents → notes per sub-topic
    Step 3: SynthesizerAgent → merged SmartNotes
    """
    splitter = app.make_agent(
        name="synapse-topic-splitter",
        instructions=TOPIC_SPLITTER_INSTRUCTIONS,
        gateway_mode="strict",
        output_schema=None,
        max_turns=5,
        memory=False,
    )
    notes_template = app.make_agent(
        name="synapse-notes-parallel",
        instructions=NOTES_INSTRUCTIONS,
        gateway_mode="quality",
        output_schema=SmartNotes,
        max_turns=10,
        memory=False,
    )
    synthesizer = app.make_agent(
        name="synapse-notes-synthesizer",
        instructions=NOTES_SYNTHESIZER_INSTRUCTIONS,
        gateway_mode="quality",
        output_schema=SmartNotes,
        max_turns=5,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
    )

    # Step 1: split topic
    split_resp = await app.runner.run(
        agent=splitter,
        input=f"Split this topic into 2-4 sub-topics: {topic}",
        user_id=student_id,
    )
    try:
        subtopics: list[str] = json.loads(split_resp.content)
    except Exception:
        subtopics = [topic]

    if len(subtopics) <= 1:
        return await _generate_notes_simple(app, student_id, topic, content)

    # Step 2: generate notes for each sub-topic in parallel
    parallel_agents = [
        notes_template.clone(name=f"notes-sub-{i}")
        for i, _ in enumerate(subtopics)
    ]
    parallel = create_parallel_agent(
        name="synapse-notes-parallel-runner",
        agents=parallel_agents,
        instructions="Generate notes for each sub-topic concurrently.",
    )
    parallel_inputs = [
        f"Generate smart notes for student '{student_id}' on sub-topic: {sub}"
        for sub in subtopics
    ]
    # Run each sub-agent
    sub_notes_list = []
    for agent_i, input_i in zip(parallel_agents, parallel_inputs):
        resp = await app.runner.run(agent=agent_i, input=input_i, user_id=student_id)
        sub_notes_list.append(resp.content)

    # Step 3: synthesize
    synth_input = (
        f"Merge these sub-topic notes into unified notes for topic '{topic}':\n"
        + json.dumps(sub_notes_list)
    )
    synth_resp = await app.runner.run(agent=synthesizer, input=synth_input, user_id=student_id)
    if synth_resp.structured_output:
        return synth_resp.structured_output
    try:
        data = json.loads(synth_resp.content)
        return SmartNotes(**data)
    except Exception as e:
        logger.warning(f"Synthesis parse failed, falling back to simple: {e}")
        return await _generate_notes_simple(app, student_id, topic, content)
