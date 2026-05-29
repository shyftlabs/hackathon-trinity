"""
Synapse AI integration tests — all real, no mocks.

Prerequisites:
  - Continuum docker-compose running (redis-sdk :6380, milvus :19530)
  - KB MCP server running (python -m synapse.mcp_server.kb_server, port 8888)
  - SMART_GATEWAY_API_KEY set in backend/.env

Tests skip (not fail) with a clear message when services or keys are unreachable.
"""

from __future__ import annotations

import os
import sys

import pytest
import pytest_asyncio

# Ensure env is loaded
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

_CONTINUUM_SRC = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "continuum", "src"
)
if os.path.isdir(_CONTINUUM_SRC) and _CONTINUUM_SRC not in sys.path:
    sys.path.insert(0, _CONTINUUM_SRC)

# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="module")
async def app():
    from synapse.agents.lifecycle import SynapseApp

    synapse = SynapseApp()
    try:
        await synapse.initialize()
    except Exception as e:
        pytest.skip(f"SynapseApp init failed (services not running?): {e}")
    yield synapse
    await synapse.close()


@pytest.fixture
def student_id():
    return "test-student-001"


@pytest.fixture
def topics():
    return ["calculus", "data structures"]


# ── KB MCP Server Tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_kb_search_returns_results(app):
    """KB MCP server returns relevant source chunks for a known topic."""
    results = await app.mcp_server.call_tool(
        "search_source_material",
        {"topic": "calculus", "query": "derivative definition", "top_k": 2},
    )
    content = results.content if hasattr(results, "content") else str(results)
    assert "derivative" in content.lower() or "Stewart" in content, (
        f"Expected derivative content in KB result, got: {content[:300]}"
    )


@pytest.mark.asyncio
async def test_kb_list_topics(app):
    topics = await app.mcp_server.call_tool("list_topics", {})
    content = str(topics)
    assert "calculus" in content.lower()


# ── Diagnostic Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_quiz_returns_questions(app, student_id, topics):
    from synapse.agents.diagnostic import generate_quiz
    quiz = await generate_quiz(app, student_id, topics)
    assert quiz.student_id == student_id
    assert len(quiz.questions) >= len(topics) * 1  # at least 1 question per topic
    for q in quiz.questions:
        assert q.topic in [t.lower() for t in topics] or any(
            t.lower() in q.topic.lower() for t in topics
        )
        assert len(q.choices) == 4


@pytest.mark.asyncio
async def test_evaluate_quiz_returns_knowledge_map(app, student_id, topics):
    from synapse.agents.diagnostic import evaluate_quiz

    # Simulate a student who answered correctly on calculus, poorly on data structures
    qa_pairs = [
        {"question_id": "q1", "topic": "calculus", "student_label": "B", "correct_label": "B"},
        {"question_id": "q2", "topic": "calculus", "student_label": "A", "correct_label": "A"},
        {"question_id": "q3", "topic": "data structures", "student_label": "C", "correct_label": "A"},
        {"question_id": "q4", "topic": "data structures", "student_label": "D", "correct_label": "B"},
    ]
    knowledge_map = await evaluate_quiz(app, student_id, topics, qa_pairs)
    assert knowledge_map.student_id == student_id
    assert len(knowledge_map.topics) == len(topics)
    assert 0.0 <= knowledge_map.overall_mastery <= 1.0

    # Calculus should be stronger than data structures
    calc = next((t for t in knowledge_map.topics if "calculus" in t.topic.lower()), None)
    ds = next((t for t in knowledge_map.topics if "data" in t.topic.lower()), None)
    assert calc is not None and ds is not None
    assert calc.level in ("strong", "moderate")
    assert ds.level in ("moderate", "needs_improvement")


# ── Memory Persistence Tests ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_knowledge_map_persists_in_memory(app, student_id, topics):
    """After evaluate_quiz, the knowledge map facts are stored in USER-scope memory."""
    from synapse.agents.diagnostic import evaluate_quiz

    qa_pairs = [
        {"question_id": "q1", "topic": "calculus", "student_label": "B", "correct_label": "B"},
        {"question_id": "q2", "topic": "data structures", "student_label": "C", "correct_label": "A"},
    ]
    await evaluate_quiz(app, student_id, topics, qa_pairs)

    memory_client = app.container.memory_client
    if not memory_client or not memory_client.is_enabled:
        pytest.skip("Memory client not enabled")

    results = await memory_client.search(
        query="student knowledge level calculus",
        user_id=student_id,
        limit=5,
    )
    assert results, "Expected at least one memory fact after diagnostic evaluation"


# ── Tutor Tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_tutor_cites_source(app, student_id):
    """Tutor response must include a source citation from the KB."""
    from synapse.agents.tutor import stream_tutor
    from synapse.models import LearningProfile

    profile = LearningProfile(modality="text", pace="methodical")
    events = []
    full_content = ""

    async for event in stream_tutor(
        app=app,
        student_id=student_id,
        topic="calculus",
        message="Explain the chain rule to me.",
        profile=profile,
    ):
        events.append(event)
        if event["type"] == "content":
            full_content += event["content"]
        if event["type"] == "done":
            break

    assert full_content, "Expected non-empty tutor response"
    # Should contain a textbook citation
    has_citation = any(
        marker in full_content
        for marker in ["Stewart", "Chapter", "§", "p.", "locator", "Early Transcendentals"]
    )
    assert has_citation, f"Tutor response lacks source citation. Got: {full_content[:500]}"


@pytest.mark.asyncio
async def test_tutor_emits_comprehension_check(app, student_id):
    """Tutor should emit at least one comprehension check during a multi-part explanation."""
    from synapse.agents.tutor import stream_tutor
    from synapse.models import LearningProfile

    profile = LearningProfile(modality="text", pace="deep")
    check_events = []

    async for event in stream_tutor(
        app=app,
        student_id=student_id,
        topic="calculus",
        message=(
            "Explain derivatives from first principles, then the chain rule, "
            "with examples. Be thorough."
        ),
        profile=profile,
    ):
        if event["type"] == "check":
            check_events.append(event)
        if event["type"] == "done":
            break

    # We expect at least one comprehension check for a thorough explanation
    assert len(check_events) >= 1, (
        "Expected at least one comprehension check event from the tutor"
    )
    check = check_events[0]["data"]
    assert "question" in check


# ── Assessment Tests ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_assessment_updates_knowledge_map(app, student_id):
    """After grading, the GradeReport contains an updated TopicStatus."""
    from synapse.agents.assessment import generate_assessment, grade_assessment

    assessment = await generate_assessment(app, student_id, "calculus")
    assert assessment.topic.lower() == "calculus"
    assert len(assessment.questions) >= 4

    # Simulate answers: answer all MCQs with first choice, all short-answers with a minimal reply
    answers = []
    for q in assessment.questions:
        if q.type == "mcq":
            answers.append({"question_id": q.id, "response": "A"})
        else:
            answers.append({"question_id": q.id, "response": "I'm not sure about this."})

    report = await grade_assessment(app, student_id, "calculus", assessment, answers)
    assert 0.0 <= report.score <= 1.0
    assert report.updated_status.topic.lower() == "calculus"
    assert report.updated_status.level in ("strong", "moderate", "needs_improvement")


# ── Smart Notes Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_smart_notes_has_sections_and_sources(app, student_id):
    """SmartNotes must have sections and at least one source citation."""
    from synapse.agents.notes import generate_notes

    notes = await generate_notes(app, student_id, "calculus")
    assert notes.topic.lower() == "calculus"
    assert notes.summary
    assert len(notes.sections) >= 2
    assert len(notes.key_concepts) >= 3
    assert len(notes.sources) >= 1
    assert notes.sources[0].title  # must have a title
