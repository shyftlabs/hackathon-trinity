"""
SynapseCoordinator — RouterAgent that dispatches to the right agent based on student intent.

Handles the full Diagnose → Teach → Verify loop by routing to:
  - DiagnosticAgent (generate/evaluate quiz)
  - TutorAgent (per-topic, streaming)
  - AssessmentAgent (generate/grade)
  - SmartNotesAgent (generate notes)

Uses Continuum's RouterAgent with explicit routes for intent classification.
Multi-agent saving pattern: suppress_session_log on sub-runs, save_turn once at the end.
"""

from __future__ import annotations

import json

from orchestrator import (
    AgentMemoryScope,
    Route,
    RouterAgent,
    create_router_agent,
    get_logger,
)

from synapse.agents.lifecycle import SynapseApp
from synapse.models import LearningProfile

logger = get_logger(__name__)

COORDINATOR_INSTRUCTIONS = """
You are Synapse AI's coordinator. Route the student's request to the right specialist:

- DIAGNOSE: student wants to assess their knowledge, take a diagnostic quiz, or find out what they know
- TUTOR: student wants to learn a topic, get an explanation, ask questions, or be tutored
- ASSESS: student wants a formal assessment, quiz, or test on a topic they've already studied
- NOTES: student wants study notes, a summary, or reference material for a topic
- KNOWLEDGE_MAP: student asks about their progress, weak areas, or what they should study next

Always identify the topic the student is asking about.
"""


def make_coordinator_agent(app: SynapseApp) -> RouterAgent:
    """Build the RouterAgent for intent classification."""

    # Intent-classification agents (lightweight, strict tier)
    diagnose_proxy = app.make_agent(
        name="coordinator-diagnose",
        instructions="You handle diagnostic quiz routing. Respond with: ROUTE:DIAGNOSE:<topic>",
        gateway_mode="strict",
        max_turns=1,
        memory=False,
    )
    tutor_proxy = app.make_agent(
        name="coordinator-tutor",
        instructions="You handle tutoring routing. Respond with: ROUTE:TUTOR:<topic>",
        gateway_mode="strict",
        max_turns=1,
        memory=False,
    )
    assess_proxy = app.make_agent(
        name="coordinator-assess",
        instructions="You handle assessment routing. Respond with: ROUTE:ASSESS:<topic>",
        gateway_mode="strict",
        max_turns=1,
        memory=False,
    )
    notes_proxy = app.make_agent(
        name="coordinator-notes",
        instructions="You handle notes routing. Respond with: ROUTE:NOTES:<topic>",
        gateway_mode="strict",
        max_turns=1,
        memory=False,
    )

    router = create_router_agent(
        name="synapse-coordinator",
        instructions=COORDINATOR_INSTRUCTIONS,
        routes=[
            Route(
                agent=diagnose_proxy,
                condition="student wants to assess knowledge, take a diagnostic quiz, or find gaps",
            ),
            Route(
                agent=tutor_proxy,
                condition="student wants to learn, be tutored, or get an explanation",
            ),
            Route(
                agent=assess_proxy,
                condition="student wants a formal assessment or test after studying",
            ),
            Route(
                agent=notes_proxy,
                condition="student wants study notes or a topic summary",
            ),
        ],
        model="auto",
        gateway_mode="strict",
    )
    return router


async def coordinate(
    app: SynapseApp,
    student_id: str,
    message: str,
    profile: LearningProfile,
) -> dict:
    """
    Route a student message to the appropriate agent.
    Returns {intent, topic, response}.
    """
    router = make_coordinator_agent(app)

    session_client = app.container.session_client
    session_id = None
    if session_client and session_client.is_enabled:
        try:
            session_id = await session_client.get_or_create_session(
                user_id=student_id,
                conversation_id="coordinator",
            )
        except Exception as e:
            logger.warning(f"Coordinator session error: {e}")

    response = await app.runner.run(
        agent=router,
        input=message,
        session_id=session_id,
        user_id=student_id,
        metadata={"profile": profile.model_dump()},
    )

    content = response.content or ""
    # Parse routing signal
    intent, topic = "TUTOR", "general"
    if "ROUTE:" in content:
        parts = content.split("ROUTE:")[-1].strip().split(":")
        if len(parts) >= 2:
            intent = parts[0].upper()
            topic = ":".join(parts[1:]).strip()

    return {
        "intent": intent,
        "topic": topic,
        "raw_response": content,
        "session_id": session_id,
    }
