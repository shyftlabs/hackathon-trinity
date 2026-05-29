"""TutorAgent — streaming, RAG-grounded, with inline comprehension checks."""
from __future__ import annotations
import re, json
from collections.abc import AsyncGenerator
from orchestrator import AgentMemoryScope, EventType, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import LearningProfile

logger = get_logger(__name__)
_CHECK_START, _CHECK_END = "<<CHECK>>", "<<END_CHECK>>"

TUTOR_INSTRUCTIONS = """You are Synapse AI's expert tutor for: {topic}

STYLE: {modality_instruction} | {pace_instruction}
Always retrieve source material via search_source_material and get_topic_sources before explaining.
Cite sources inline, e.g. "(CLRS 4e, Chapter 3)".

After every key concept (3-4 paragraphs), embed ONE comprehension check on its own line:
<<CHECK>>
{{"question": "...", "hint": "...", "expected_insight": "..."}}
<<END_CHECK>>

If student says "test me" / "I'm ready" / "quiz me" → reply "Handing you off to assessment." and stop.
"""

_MODALITY = {"visual":"Use diagrams, ASCII art, spatial metaphors.", "text":"Use clear prose, headings, bullets.", "audio":"Write conversationally as if speaking aloud."}
_PACE = {"deep":"Explain the why, edge cases, adjacent topics.", "methodical":"Build from first principles, confirm at each step."}


def _agent_name(prefix: str, topic: str) -> str:
    """Continuum requires alphanumeric agent names with hyphens/underscores only."""
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", topic.lower()).strip("-") or "topic"
    return f"{prefix}-{slug}"[:64]


async def stream_tutor(app: SynapseApp, student_id: str, topic: str,
                       message: str, profile: LearningProfile) -> AsyncGenerator[dict, None]:
    instructions = (TUTOR_INSTRUCTIONS
        .replace("{topic}", topic)
        .replace("{modality_instruction}", _MODALITY[profile.modality])
        .replace("{pace_instruction}", _PACE[profile.pace]))

    agent = app.make_agent(name=_agent_name("tutor", topic),
                           instructions=instructions, gateway_mode="quality",
                           max_turns=30, memory=True, memory_scope=AgentMemoryScope.CONVERSATION, tool_attention_k=4)

    session_id = None
    sc = app.container.session_client
    if sc and sc.is_enabled:
        try:
            session_id = await sc.get_or_create_session(user_id=student_id, conversation_id=f"tutor-{topic}")
        except Exception as e:
            logger.warning("Session init: %s", e)

    check_buf, in_check = "", False
    try:
        async for event in app.runner.run_stream(agent=agent, input=message,
                                                  session_id=session_id, user_id=student_id):
            if event.type == EventType.CONTENT_DELTA:
                chunk = event.data.get("content", "")
                if not chunk:
                    continue
                if in_check:
                    check_buf += chunk
                    if _CHECK_END in check_buf:
                        j, _, rest = check_buf.partition(_CHECK_END)
                        in_check, check_buf = False, ""
                        try: yield {"type": "check", "data": json.loads(j.strip())}
                        except Exception: pass
                        if rest: yield {"type": "content", "content": rest}
                elif _CHECK_START in chunk:
                    before, _, after = chunk.partition(_CHECK_START)
                    if before: yield {"type": "content", "content": before}
                    in_check, check_buf = True, after
                    if _CHECK_END in check_buf:
                        j, _, rest = check_buf.partition(_CHECK_END)
                        in_check, check_buf = False, ""
                        try: yield {"type": "check", "data": json.loads(j.strip())}
                        except Exception: pass
                        if rest: yield {"type": "content", "content": rest}
                else:
                    yield {"type": "content", "content": chunk}
            elif event.type == EventType.TOOL_CALL_START:
                yield {"type": "tool", "tool_name": event.data.get("tool_name",""), "status":"start"}
            elif event.type == EventType.TOOL_CALL_END:
                yield {"type": "tool", "tool_name": event.data.get("tool_name",""), "status":"end"}
            elif event.type == EventType.RUN_END:
                yield {"type": "done"}; break
            elif event.type == EventType.RUN_ERROR:
                yield {"type": "error", "error": event.data.get("error","Unknown")}; break
    except Exception as e:
        logger.error("Tutor stream error: %s", e)
        yield {"type": "error", "error": str(e)}
