# 🎯 Quick Reference Card

## Setup (Copy & Paste)

```bash
# 1. Install
npm install

# 2. Configure  
cp .env.local.example .env.local
# Edit .env.local with API keys (optional for testing)

# 3. Initialize DB
npm run db:migrate

# 4. Start
npm run dev

# 5. Verify
node scripts/verify-setup.js
```

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run db:migrate` | Initialize/update database |
| `npm run db:studio` | View database UI |
| `npm run setup` | Auto-setup everything |
| `npm run test:backend` | Verify integration |
| `npm run lint` | Check code |
| `npm run build` | Build for production |

## API Endpoints (Cheat Sheet)

```bash
# List sessions
GET /api/sessions

# Create session with files
POST /api/sessions
  -F "title=..."
  -F "activeModes=[...]"
  -F "files=@file.pdf"

# Get session details
GET /api/sessions/[id]

# Generate content
POST /api/generate
  -d '{sessionId, modes: [], topic, complexity}'

# Delete session
DELETE /api/sessions/[id]
```

## Environment Variables

```env
# REQUIRED for anything to work
DATABASE_URL="file:./backend/prisma/dev.db"

# OPTIONAL but recommended
ELEVENLABS_API_KEY="sk_..."
SMART_GATEWAY_URL="https://..."
SMART_GATEWAY_API_KEY="sk_..."

# OPTIONAL for tuning
CONTINUUM_MODEL="auto"  # or: gpt-4o, claude-3-5-sonnet
NODE_ENV="development"
```

## Database Tips

```bash
# View database UI
npx prisma studio
# Opens: http://localhost:5555

# Reset database (⚠️ deletes all data)
npm run db:reset

# Generate Prisma client after schema changes
npx prisma generate
```

## Testing API

```bash
# Using curl
curl http://localhost:3000/api/sessions | jq

# Using Postman
- Import API_REFERENCE.md examples
- Test endpoints one by one

# Using REST Client (VS Code)
- Install "REST Client" extension
- Create .http or .rest files
- Click "Send Request"
```

## Study Modes

| Mode | Input | Output | Notes |
|------|-------|--------|-------|
| notes | Topic + complexity | Markdown | Structured notes |
| flashcards | Topic + complexity | JSON | Q&A cards |
| quiz | Topic + complexity | JSON | MCQ with explanations |
| podcast | Topic + complexity | JSON + Audio | Script + MP3 audio |
| quest | Topic + complexity | JSON | Interactive story |
| visual | Topic + complexity | JSON | Mind map structure |

## Troubleshooting Matrix

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 PID` |
| Module @backend not found | Restart dev server |
| Database file missing | Run `npm run db:migrate` |
| API returns mock data | Check API keys in `.env.local` |
| ElevenLabs errors | Verify key format: `sk_...` |
| File upload fails | Check file < 50MB |

## Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **GETTING_STARTED.md** | Quick start guide | 5 min |
| **BACKEND_SETUP.md** | Complete setup | 30 min |
| **API_REFERENCE.md** | API endpoints | 20 min |
| **ARCHITECTURE.md** | System design | 15 min |
| **SETUP_CHECKLIST.md** | Verification | 10 min |

## Key Files to Know

```
.env.local              # Your configuration (CREATE THIS)
GETTING_STARTED.md      # Start here → READ THIS
frontend/tsconfig.json  # @backend alias mapping
backend/src/ai.ts       # AI integration logic
backend/prisma/         # Database schema & migrations
frontend/src/app/api/   # All API endpoints
```

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database initialized
- [ ] API endpoints tested
- [ ] Frontend builds without errors
- [ ] Database backed up
- [ ] Secrets not in git
- [ ] Ready for production

## One-Liner Tests

```bash
# Test API
curl http://localhost:3000/api/sessions | jq '.[0].id'

# Test database
npx prisma studio

# Test types
npm run lint

# Test all
node scripts/verify-setup.js
```

## Architecture in 30 Seconds

```
User uploads file
    ↓
Next.js API route processes
    ↓
Backend extracts text (fileParser)
    ↓
Prisma saves to database
    ↓
Frontend requests generation
    ↓
AI logic uses Continuum + ElevenLabs
    ↓
Results saved to database
    ↓
Frontend renders generated content
```

## Tech Stack at a Glance

**Frontend:** Next.js 16 + React 19 + TypeScript
**Backend:** Node.js + Prisma + SQLite
**AI:** Continuum (routing) + ElevenLabs (audio)
**Database:** SQLite (local) / LibSQL (cloud)

## Critical Path to Production

1. ✅ Local setup works (npm run dev)
2. ✅ All API tests pass (curl /api/sessions)
3. ✅ Database migration successful
4. ✅ API keys configured
5. ✅ Ready to deploy

## Getting Help

- **Setup issues?** → GETTING_STARTED.md
- **API questions?** → API_REFERENCE.md
- **Architecture?** → ARCHITECTURE.md
- **Config help?** → BACKEND_SETUP.md
- **Stuck?** → Check terminal logs + browser console

---

## Quick Wins

```bash
# Create a test session
curl -X POST http://localhost:3000/api/sessions \
  -F "title=Test Session"

# Generate notes
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"...","modes":["notes"],"topic":"Test","complexity":50}'

# View database
npx prisma studio
```

## Remember

- 💾 Database in: `backend/prisma/dev.db`
- 📝 Config file: `.env.local`
- 🔌 API routes: `frontend/src/app/api/`
- 📚 Docs: Root directory
- 🧠 Backend logic: `backend/src/`

---

**Status: ✅ Fully Integrated & Ready**

Start with: `npm run dev` then visit `http://localhost:3000`
