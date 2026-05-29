"""
Synapse AI — singleton lifecycle/runner.

All agents share one initialized OrchestratorLifecycle and one AgentRunner.
Call `get_synapse_app()` on startup; call `close_synapse_app()` on shutdown.
"""

from __future__ import annotations

import os
import sys
from typing import Any

# Make sure the Continuum src is importable if not installed as a package
_CONTINUUM_SRC = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "continuum", "src"
)
if os.path.isdir(_CONTINUUM_SRC) and _CONTINUUM_SRC not in sys.path:
    sys.path.insert(0, _CONTINUUM_SRC)

from orchestrator import (
    AgentConfig,
    AgentMemoryConfig,
    AgentMemoryScope,
    AgentRunner,
    BaseAgent,
    MCPServerStreamableHttp,
    RunnerConfig,
    ToolExecutor,
    get_logger,
)
from orchestrator.core.container import Container, get_container
from orchestrator.core.lifecycle import OrchestratorLifecycle, get_lifecycle_manager
from orchestrator.tools.tool_attention.config import ToolAttentionConfig
from orchestrator.tools.types import ToolContextConfig

logger = get_logger(__name__)

KB_MCP_URL = os.environ.get("KB_MCP_URL", "http://localhost:8888/mcp")


class SynapseApp:
    """Holds all shared Synapse AI runtime state."""

    def __init__(self) -> None:
        self._lifecycle: OrchestratorLifecycle | None = None
        self._container: Container | None = None
        self._mcp_server: MCPServerStreamableHttp | None = None
        self._tool_executor: ToolExecutor | None = None
        self._runner: AgentRunner | None = None
        self._tools: list[Any] = []
        self._initialized = False

    async def initialize(self) -> None:
        if self._initialized:
            return

        self._lifecycle = get_lifecycle_manager(
            fail_on_unhealthy=False,
            verify_connections=True,
            enable_signal_handlers=False,
        )
        await self._lifecycle.initialize()
        self._container = get_container()

        await self._connect_kb_mcp()

        self._runner = AgentRunner(
            container=self._container,
            tool_executor=self._tool_executor,
            config=RunnerConfig(persist_state=False, default_max_turns=20),
        )
        self._initialized = True
        logger.info("✓ SynapseApp ready")

    async def _connect_kb_mcp(self) -> None:
        logger.info(f"Connecting to KB MCP server: {KB_MCP_URL}")
        self._mcp_server = MCPServerStreamableHttp(
            params={"url": KB_MCP_URL},
            client_session_timeout_seconds=60,
        )
        await self._mcp_server.connect()

        self._tool_executor = ToolExecutor({self._mcp_server: None})
        await self._tool_executor.initialize()
        self._tools = self._tool_executor.get_tool_definitions()
        names = [t.function.name for t in self._tools]
        logger.info(f"✓ KB tools discovered: {', '.join(names)}")

    def make_agent(
        self,
        *,
        name: str,
        instructions: str,
        gateway_mode: str = "quality",
        output_schema: type | None = None,
        max_turns: int = 15,
        memory: bool = True,
        memory_scope: AgentMemoryScope = AgentMemoryScope.USER,
        tool_attention_k: int = 3,
    ) -> BaseAgent:
        """Factory that wires in the shared KB MCP server and memory config."""
        memory_client = self._container.memory_client if self._container else None
        mem_enabled = memory and memory_client is not None and memory_client.is_enabled

        return BaseAgent(
            name=name,
            instructions=instructions,
            model="auto",
            gateway_mode=gateway_mode,
            tools=self._tools,
            tool_executor=self._tool_executor,
            output_schema=output_schema,
            memory_config=AgentMemoryConfig(
                search_memories=mem_enabled,
                store_memories=mem_enabled,
                search_scope=memory_scope,
                store_scope=memory_scope,
                search_limit=8,
                extraction_prompt=(
                    "Extract long-term educational facts about the student: their knowledge gaps, "
                    "strong topics, learning preferences, and misconceptions. "
                    "Do NOT store transient quiz answers or session-specific messages."
                ),
            ),
            config=AgentConfig(
                max_turns=max_turns,
                log_to_session=True,
                tool_attention=ToolAttentionConfig(k=tool_attention_k, min_tools=3),
            ),
        )

    @property
    def runner(self) -> AgentRunner:
        if not self._runner:
            raise RuntimeError("SynapseApp not initialized")
        return self._runner

    @property
    def container(self) -> Container:
        if not self._container:
            raise RuntimeError("SynapseApp not initialized")
        return self._container

    @property
    def tools(self) -> list[Any]:
        return self._tools

    @property
    def mcp_server(self) -> MCPServerStreamableHttp:
        if not self._mcp_server:
            raise RuntimeError("SynapseApp not initialized")
        return self._mcp_server

    async def close(self) -> None:
        if self._mcp_server:
            try:
                await self._mcp_server.cleanup()
            except Exception:
                pass
        if self._lifecycle:
            await self._lifecycle.shutdown()
        self._initialized = False


_synapse_app: SynapseApp | None = None


def get_synapse_app() -> SynapseApp:
    global _synapse_app
    if _synapse_app is None:
        _synapse_app = SynapseApp()
    return _synapse_app


async def close_synapse_app() -> None:
    global _synapse_app
    if _synapse_app:
        await _synapse_app.close()
        _synapse_app = None
