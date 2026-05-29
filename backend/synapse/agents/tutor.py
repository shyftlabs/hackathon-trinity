"""
TutorAgent — streaming, grounded, adaptive topic tutor.

Features:
- Retrieves source material from KB MCP server (RAG)
- Adapts explanation style to LearningProfile (template_vars + instruction_modifiers)
- Emits inline comprehension checks as <<CHECK>>...<<END_CHECK>> sentinels
- Hands off to AssessmentAgent when student signals readiness
- Memory scope: CONVERSATION (per-topic thread, isolated from other topics)

The SSE router parses comprehension-check sentinels from the stream and emits
them as distinct 'check' events to the frontend.
"""

from __future__ import annotations

import re
from collections.abc import AsyncGenerator

from orchestrator import AgentMemoryScope, EventType, get_logger

from synapse.agents.lifecycle import SynapseApp
from synapse.models import LearningProfile

logger = get_logger(__name__)

_CHECK_START = "<<CHECK>>"
_CHECK_END = "<<END_CHECK>>"
_CHECK_PATTERN = re.compile(r"<<CHECK>>(.*?)<<END_CHECK>>", re.DOTALL)

TUTOR_BASE_INSTRUCTIONS = """
You are Synapse AI's expert tutor for undergraduate students. Your goal is to help the student
deeply understand {topic}.

TEACHING APPROACH:
- {modality_instruction}
- {pace_instruction}
- Always ground your explanations in the source material (use search_source_material and
  get_topic_sources tools before explaining any concept).
- Cite your sources inline: e.g. "(Stewart 9e, Chapter 3, §3.4)"
- Adapt based on the student's responses — slow down if confused, advance if mastering.

COMPREHENSION CHECKS:
After explaining a key concept (roughly every 3-4 paragraphs), embed ONE comprehension check
in this EXACT format on its own line:
<<CHECK>>
{{"question": "...", "hint": "...", "expected_insight": "..."}}
<<END_CHECK>>

Continue your explanation after the check. Do NOT put text inside the markers other than the JSON.

HANDOFF:
If the student says they are ready for a formal assessment (e.g., "test me", "I'm ready",
"quiz me"), respond with: "Great! Let me hand you off to the assessment module." and STOP.
The system will detect this signal.

TOPIC: {topic}
STUDENT LEARNING PROFILE:
- Modality: {modality}
- Pace: {pace}
"""

_MODALITY_INSTRUCTIONS = {
    "visual": "Use diagrams described in text (ASCII art, numbered steps), analogies, and spatial metaphors.",
    "text": "Use clear, well-structured prose with headings and bullet points.",
    "audio": "Write in a conversational, narrative style as if explaining aloud.",
}

_PACE_INSTRUCTIONS = {
    "deep": "Go deep: explain the 'why' behind every concept, explore edge cases, connect to adjacent topics.",
    "methodical": "Be systematic: build up from first principles, confirm understanding at each step before moving on.",
}


def _modality_modifier(instructions: str, context: dict) -> str:
    profile: LearningProfile = context.get("profile", LearningProfile())
    instr = instructions.replace("{modality_instruction}", _MODALITY_INSTRUCTIONS[profile.modality])
    instr = instr.replace("{pace_instruction}", _PACE_INSTRUCTIONS[profile.pace])
    instr = instr.replace("{modality}", profile.modality)
    instr = instr.replace("{pace}", profile.pace)
    return instr


def make_tutor_agent(app: SynapseApp, topic: str, profile: LearningProfile):
    """Create a topic-specific TutorAgent with profile-adapted instructions."""
    instructions = TUTOR_BASE_INSTRUCTIONS.replace("{topic}", topic)

    return app.make_agent(
        name=f"tutor-{topic.lower().replace(' ', '-')}",
        instructions=instructions,
        gateway_mode="quality",
        output_schema=None,
        max_turns=30,
        memory=True,
        memory_scope=AgentMemoryScope.CONVERSATION,
        tool_attention_k=4,
    )


async def stream_tutor(
    app: SynapseApp,
    student_id: str,
    topic: str,
    message: str,
    profile: LearningProfile,
) -> AsyncGenerator[dict, None]:
    """
    Stream tutor response as structured events.
    Yields dicts: {type: 'content'|'check'|'tool'|'done'|'error', ...}
    """
    agent = make_tutor_agent(app, topic, profile)

    session_client = app.container.session_client
    session_id = None
    if session_client and session_client.is_enabled:
        try:
            session_id = await session_client.get_or_create_session(
                user_id=student_id,
                conversation_id=f"tutor-{topic}",
            )
        except Exception as e:
            logger.warning(f"Session init failed: {e}")

    check_buffer = ""
    in_check = False

    try:
        async for event in app.runner.run_stream(
            agent=agent,
            input=message,
            session_id=session_id,
            user_id=student_id,
            metadata={"topic": topic, "profile": profile.model_dump()},
        ):
            if event.type == EventType.CONTENT_DELTA:
                chunk: str = event.data.get("content", "")
                if not chunk:
                    continue

                if in_check:
                    check_buffer += chunk
                    if _CHECK_END in check_buffer:
                        end_idx = check_buffer.index(_CHECK_END)
                        json_part = check_buffer[:end_idx].strip()
                        remainder = check_buffer[end_idx + len(_CHECK_END):]
                        in_check = False
                        check_buffer = ""
                        try:
                            import json
                            check_data = json.loads(json_part)
                            yield {"type": "check", "data": check_data}
                        except Exception:
                            yield {"type": "content", "content": json_part}
                        if remainder:
                            yield {"type": "content", "content": remainder}
                    continue

                if _CHECK_START in chunk:
                    before, _, after = chunk.partition(_CHECK_START)
                    if before:
                        yield {"type": "content", "content": before}
                    in_check = True
                    check_buffer = after
                    if _CHECK_END in check_buffer:
                        end_idx = check_buffer.index(_CHECK_END)
                        json_part = check_buffer[:end_idx].strip()
                        remainder = check_buffer[end_idx + len(_CHECK_END):]
                        in_check = False
                        check_buffer = ""
                        try:
                            import json
                            check_data = json.loads(json_part)
                            yield {"type": "check", "data": check_data}
                        except Exception:
                            pass
                        if remainder:
                            yield {"type": "content", "content": remainder}
                else:
                    yield {"type": "content", "content": chunk}

            elif event.type == EventType.TOOL_CALL_START:
                yield {
                    "type": "tool",
                    "tool_name": event.data.get("tool_name", ""),
                    "status": "start",
                }

            elif event.type == EventType.TOOL_CALL_END:
                yield {
                    "type": "tool",
                    "tool_name": event.data.get("tool_name", ""),
                    "status": "end",
                }

            elif event.type == EventType.RUN_END:
                yield {"type": "done"}
                break

            elif event.type == EventType.RUN_ERROR:
                yield {"type": "error", "error": event.data.get("error", "Unknown error")}
                break

    except Exception as e:
        logger.error(f"Tutor stream error: {e}")
        yield {"type": "error", "error": str(e)}
