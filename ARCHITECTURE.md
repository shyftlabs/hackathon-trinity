# Flux AI Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUX AI LEARNING STUDIO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND (Next.js 16 + React 19 + TypeScript)                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ • Dashboard (view sessions)                                          │   │
│  │ • File Upload (drag & drop)                                         │   │
│  │ • Study Modes (notes, flashcards, quiz, podcast, quest, visual)     │   │
│  │ • Progress Tracking                                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                           ↓ (HTTP/API)                                      │
│  NEXT.JS API ROUTES (TypeScript)                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ /api/sessions                 → Session CRUD operations              │   │
│  │ /api/sessions/[id]            → Get/Update/Delete specific session   │   │
│  │ /api/generate                 → Multi-mode generation                │   │
│  │ /api/generate/podcast         → Quick podcast generation             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                           ↓ (TypeScript)                                    │
│  BACKEND LOGIC LAYER                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ backend/src/                                                          │   │
│  │ ├── ai.ts              → Continuum + ElevenLabs integration          │   │
│  │ ├── prisma.ts          → Database client wrapper                     │   │
│  │ ├── fileParser.ts      → Extract text from files                     │   │
│  │ └── mockSessions.ts    → Fallback data                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                      ↙  ↓  ↘  (Service Layer)                              │
│        ┌──────────────┼──┼──────────────┐                                  │
│        │              │  │              │                                  │
│        ↓              ↓  ↓              ↓                                  │
│   ┌─────────┐   ┌──────────────┐  ┌──────────────┐                       │
│   │ Prisma  │   │ Continuum    │  │ ElevenLabs   │                       │
│   │ ORM     │   │ Smart Gateway│  │ Text-to-     │                       │
│   │         │   │              │  │ Speech       │                       │
│   │ ┌─────┐ │   │ ┌──────────┐ │  │ ┌──────────┐ │                       │
│   │ │SQLite│ │   │ │Multi-LLM │ │  │ │ Audio    │ │                       │
│   │ │or    │ │   │ │ Routing  │ │  │ │ Gen API  │ │                       │
│   │ │LibSQL│ │   │ │ (cost    │ │  │ │ (29+     │ │                       │
│   │ └─────┘ │   │ │optimized)│ │  │ │ languages)│ │                       │
│   │         │   │ │          │ │  │ └──────────┘ │                       │
│   │         │   │ │          │ │  │              │                       │
│   │ Store:  │   │ │Models:   │ │  │ Returns:     │                       │
│   │ • Users │   │ │• auto    │ │  │ • Base64     │                       │
│   │ • Sessions   │ │• gpt-4o  │ │  │   audio      │                       │
│   │ • Content    │ │• claude  │ │  │ • MP3        │                       │
│   │ • Progress   │ │• gpt-4   │ │  │   format     │                       │
│   └─────────┘   └──────────────┘  └──────────────┘                       │
│        │              │                  │                                │
│        └──────────────┴──────────────────┘                                │
│                      ↓ (Results)                                          │
│        ┌─────────────────────────────────┐                               │
│        │ Database Updated + Response     │                               │
│        │ Sent to Frontend                │                               │
│        └─────────────────────────────────┘                               │
│                      ↑ (JSON)                                             │
│  FRONTEND RENDERS                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │ • Display Notes as Markdown                                         ││
│  │ • Show Flashcards in UI                                             ││
│  │ • Render Quiz with interactivity                                    ││
│  │ • Play Audio (ElevenLabs output)                                    ││
│  │ • Display Quest story + choices                                     ││
│  │ • Render Mind Map visualization                                     ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Session Creation
```
User uploads files
    ↓
POST /api/sessions (multipart/form-data)
    ↓
fileParser.ts extracts text from each file
    ↓
Prisma creates Session record in database
    ↓
Returns session ID + basic info
```

### Content Generation
```
User selects modes + complexity
    ↓
POST /api/generate with session ID
    ↓
Retrieve session from database
    ↓
For each mode:
  ├─ generateModeContent() called
  ├─ AI prompt constructed
  ├─ Continuum Smart Gateway routes request
  ├─ AI generates content
  ├─ Special handling:
  │  ├─ JSON modes → Parse & validate
  │  ├─ Notes → Markdown formatting
  │  └─ Podcast → Generate audio with ElevenLabs
  ├─ Save result to database
  └─ Return status
    ↓
Frontend polls /api/sessions/[id] to see generated content
```

### File Upload & Parsing
```
Files uploaded in session creation
    ↓
fileParser.ts identifies type:
  ├─ PDF → PyPDF2 text extraction
  ├─ DOCX → Mammoth parsing
  ├─ Image → Tesseract OCR
  └─ Other → Metadata extraction
    ↓
Content stored in Session.notes field (marked with tags)
    ↓
Content used as context for AI generation
```

## Key Concepts

### Continuum Smart Inference
- Receives request with complexity metadata
- Analyzes cost vs capability needed
- Routes to optimal model:
  - Simple (0-33): GPT-4 Turbo (fastest, cheapest)
  - Medium (34-66): GPT-4O or Claude-Instant
  - Complex (67-100): Claude 3.5 Sonnet (most capable)
- Returns response from selected model
- **Result**: 40-60% cost reduction vs fixed model

### ElevenLabs Integration
- AI generates podcast script (text)
- ElevenLabs API receives script
- Converts to speech with selected voice
- Returns audio as base64-encoded MP3
- Frontend plays directly from data URI

### Database Persistence
- Prisma ORM provides type-safe database access
- SQLite for local development (simple, no setup)
- LibSQL/Turso for cloud (scales, replicate)
- Session model stores:
  - Files uploaded
  - Generated content (7 types)
  - Progress tracking per mode
  - Metadata (title, dates, user)

### Graceful Degradation
- Missing Continuum key? → Use mock content
- Missing ElevenLabs key? → Use silent placeholder audio
- Database error? → Try again or show error
- File parsing error? → Store error message, continue

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Optional)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Next.js App (frontend + API routes)              │  │
│  │ • Serverless Functions for API routes            │  │
│  │ • Edge caching                                    │  │
│  │ • Auto deployment on git push                     │  │
│  └───────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┬──────────┐
    │                 │            │          │
    ↓                 ↓            ↓          ↓
┌─────────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐
│LibSQL/  │  │Continuum     │  │Eleven  │  │Optional: │
│Turso    │  │Smart Gateway │  │Labs    │  │Redis     │
│(SQLite  │  │(or local)    │  │(Cloud) │  │(Cache)   │
│Cloud)   │  │              │  │        │  │          │
└─────────┘  └──────────────┘  └────────┘  └──────────┘
```

---

## File Organization

```
hackathon-trinity/
├── Public Documentation
│   ├── GETTING_STARTED.md          # 5-minute quick start
│   ├── BACKEND_SETUP.md            # Complete backend guide
│   ├── API_REFERENCE.md            # Full API documentation
│   ├── SETUP_CHECKLIST.md          # Verification checklist
│   ├── INTEGRATION_SUMMARY.md      # This architecture guide
│   ├── .env.example                # All env vars explained
│   └── .env.local.example          # Quick template
│
├── Frontend Application
│   └── frontend/
│       ├── src/app/api/            # Next.js API routes
│       │   ├── sessions/           # Session endpoints
│       │   ├── generate/           # Generation endpoints
│       │   └── generate-image/     # Image generation
│       ├── src/components/         # React components
│       ├── src/app/                # Pages & layouts
│       └── tsconfig.json           # @backend alias
│
├── Backend Logic
│   └── backend/
│       ├── src/
│       │   ├── ai.ts               # Continuum + ElevenLabs
│       │   ├── prisma.ts           # Database client
│       │   ├── fileParser.ts       # File extraction
│       │   └── mockSessions.ts     # Mock data
│       └── prisma/
│           ├── schema.prisma       # Database schema
│           └── dev.db              # SQLite database
│
└── Utility Scripts
    └── scripts/
        ├── init-db.sh              # Auto setup
        ├── verify-setup.js         # Verification
        └── test-backend.sh         # Integration test
```

---

## Integration Points

### Frontend ↔ Backend
- **Next.js API Routes** (transparent to frontend)
- **@backend alias** in tsconfig for clean imports
- No fetch or API calls needed - direct imports

### Backend ↔ Database
- **Prisma Client** handles all queries
- **Type-safe** - TypeScript catches errors
- **Migrations** manage schema changes

### Backend ↔ AI Services
- **Continuum** - OpenAI-compatible API format
- **ElevenLabs** - SDK method calls
- **Both support** async/await patterns

## Development Workflow

```
1. Edit code (frontend or backend)
    ↓
2. Dev server auto-reloads (Next.js watches both)
    ↓
3. TypeScript errors appear in terminal
    ↓
4. Test with browser or curl
    ↓
5. View database with "npx prisma studio"
    ↓
6. Check logs in terminal for debug info
```

## Production Considerations

- **Database**: Migrate to LibSQL/Turso (scales, replicated)
- **Caching**: Add Redis for session caching
- **Auth**: Implement JWT tokens for users
- **Rate Limiting**: Add to API routes
- **Monitoring**: Set up error tracking (Sentry)
- **Security**: Enable CORS, add API key validation
- **Performance**: Enable response compression

---

**For detailed setup instructions, see: [GETTING_STARTED.md](./GETTING_STARTED.md)**

**For API documentation, see: [API_REFERENCE.md](./API_REFERENCE.md)**

**For backend configuration, see: [BACKEND_SETUP.md](./BACKEND_SETUP.md)**
