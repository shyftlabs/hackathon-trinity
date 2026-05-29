# Synapse AI — Team Ownership Map

Splitting ownership prevents merge conflicts. Each developer owns their subtree exclusively.

## 🎓 Student Developer

| Path | Notes |
|---|---|
| `synapse/routers/student/` | All student-facing API endpoints |
| `synapse/db/student/` | Student DB queries (Supabase) |
| `synapse/agents/` | Continuum agents (diagnostic, tutor, assessment, notes) |
| `tests/` | Integration tests |

## 🏫 Teacher Developer

| Path | Notes |
|---|---|
| `synapse/routers/teacher/` | All teacher-facing API endpoints |
| `synapse/db/teacher/` | Teacher DB queries (Supabase) |

## 🔒 Shared — PR required to edit

| Path | Notes |
|---|---|
| `synapse/app.py` | FastAPI app + lifespan + router mounting |
| `synapse/models.py` | All Pydantic models |
| `synapse/db/client.py` | Supabase client singleton |
| `synapse/mcp_server/` | KB MCP server |
| `pyproject.toml` | Dependencies |
| `.env` | Environment config |
| `synapse/migrations/` | SQL migrations |

## Running locally

```bash
# 1. Install Python deps
pip install -e .

# 2. Start Supabase locally
supabase start            # requires supabase CLI
# OR use Supabase Cloud and set SUPABASE_URL / keys in .env

# 3. Start Continuum services (Redis, Milvus)
cd ../continuum && docker compose up -d

# 4. Run DB migrations
python -m synapse.migrations.run

# 5. Start KB MCP server
python -m synapse.mcp_server.kb_server

# 6. Start API
uvicorn synapse.app:app --port 8000 --reload

# 7. Frontend (port 3001 — Supabase Studio/Langfuse on 3000)
cd ../frontend && npm run dev -- -p 3001
```
