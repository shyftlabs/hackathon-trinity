# 🚀 Backend Integration & Setup Guide

This document describes the complete backend setup for Flux AI Learning Studio, including database configuration, API integration, and environment setup.

## Project Architecture

```
frontend/                          # Next.js application
├── src/app/api/                   # API Routes (NextJS)
│   ├── sessions/                  # CRUD operations for study sessions
│   ├── generate/[mode]/           # Content generation endpoints
│   └── generate-image/            # Image generation endpoint
└── src/components/                # React components

backend/
├── src/                           # TypeScript backend code
│   ├── ai.ts                      # Continuum + ElevenLabs integration
│   ├── prisma.ts                  # Database client wrapper
│   ├── fileParser.ts              # File extraction (PDF, DOCX, etc.)
│   └── mockSessions.ts            # Mock data for testing
├── continuum/                     # Python agent runtime (optional)
└── prisma/
    ├── schema.prisma              # Database schema
    └── migrations/                # Migration history
```

## 📋 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and set your API keys:
# - DATABASE_URL (SQLite by default)
# - ELEVENLABS_API_KEY
# - SMART_GATEWAY_URL & SMART_GATEWAY_API_KEY (for Continuum)
```

### 3. Initialize Database
```bash
# Create/migrate the database
npm run db:migrate

# Or run Prisma Studio to inspect the database
npx prisma studio
```

### 4. Start Development Server
```bash
npm run dev
```

The app runs on `http://localhost:3000`

---

## 🗄️ Database Setup

### SQLite (Default - Local Development)

SQLite is the default database and requires no external setup:
- **File location**: `backend/prisma/dev.db`
- **Configuration**: `DATABASE_URL="file:./backend/prisma/dev.db"`

**Pros:**
- Zero setup, works out of the box
- Perfect for development and local testing
- Portable (single file)

**To backup your data:**
```bash
cp backend/prisma/dev.db backend/prisma/dev.db.backup
```

### LibSQL / Turso (Cloud - Optional)

For production or cloud deployment:

1. **Create a Turso account** at https://turso.tech
2. **Create a database**:
   ```bash
   turso db create flux-ai
   ```
3. **Get your connection string**:
   ```bash
   turso db show --url flux-ai
   turso db tokens create flux-ai
   ```
4. **Update `.env.local`**:
   ```
   DATABASE_URL="libsql://your-database.turso.io?authToken=your-auth-token"
   ```

**To migrate to LibSQL:**
```bash
npm run db:migrate
# Prisma will apply all migrations to the cloud database
```

---

## 🤖 AI Integration

### Continuum Smart Inference Gateway

Continuum provides cost-aware multi-LLM routing. It automatically selects the most efficient model based on request complexity.

**Setup:**

1. **Get API credentials from Continuum Dashboard**
2. **Set environment variables**:
   ```
   SMART_GATEWAY_URL="https://your-gateway-url/chat/completions"
   SMART_GATEWAY_API_KEY="sk_gateway_..."
   CONTINUUM_MODEL="auto"  # or specific model: gpt-4o, claude-3-5-sonnet
   ```

**Configuration Details:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `SMART_GATEWAY_URL` | Continuum endpoint | `http://localhost:8000/v1/chat/completions` |
| `SMART_GATEWAY_API_KEY` | Authentication | `sk_gateway_abc123...` |
| `CONTINUUM_MODEL` | Model selection | `auto`, `gpt-4o`, `claude-3-5-sonnet` |

**Fallback Behavior:**

If Continuum is not configured:
- ✅ Supports graceful fallback to mock content
- ✅ Frontend still renders normally
- ❌ AI generation features disabled
- Useful for testing without API keys

**Cost Estimation:**

Continuum Smart Inference optimizes costs by:
- Routing simple requests to faster/cheaper models (GPT-4 mini)
- Routing complex requests to capable models (Claude 3.5 Sonnet)
- Average savings: 40-60% vs fixed model usage

### ElevenLabs Text-to-Speech

Generates audio for podcast/audio study modes.

**Setup:**

1. **Create account** at https://elevenlabs.io
2. **Get your API key** from the dashboard
3. **Set environment variable**:
   ```
   ELEVENLABS_API_KEY="sk_..."
   ```

**Voice Configuration:**

- **Current voice**: Rachel (ID: `EXAVITQu4vr4xnSDxMaL`)
- **To change voice**: Edit `VOICE_ID` in `backend/src/ai.ts`
- **Find voice IDs**: https://api.elevenlabs.io/v1/voices

**Features:**

- ✅ Supports 29+ languages
- ✅ Output format: MP3 (44.1 kHz, 128 kbps)
- ✅ Gracefully falls back to silent audio if key missing
- ✅ Automatic error handling

---

## 🔌 API Routes

All API routes are defined in `frontend/src/app/api/`.

### Sessions Management

#### **GET /api/sessions**
Fetch all study sessions.

```bash
curl http://localhost:3000/api/sessions
```

**Response:**
```json
[
  {
    "id": "cuid-here",
    "title": "Quantum Mechanics Fundamentals",
    "date": "May 29",
    "lastStudied": "Just now",
    "materials": { "pdfs": 1, "audio": 0, "video": 0, "image": 2 },
    "activeModes": ["notes", "flashcards", "quiz"],
    "createdAt": "2026-05-29T..."
  }
]
```

#### **POST /api/sessions**
Create a new session with files.

```bash
curl -X POST http://localhost:3000/api/sessions \
  -F "title=Biology 101" \
  -F "activeModes=[\"notes\",\"flashcards\"]" \
  -F "files=@chapter1.pdf"
```

**Request body (FormData):**
- `title` (string, optional) - Session title
- `files` (File[], optional) - Uploaded documents
- `activeModes` (JSON string) - Study modes to activate

#### **GET /api/sessions/[id]**
Fetch a specific session with generated content.

```bash
curl http://localhost:3000/api/sessions/abc123
```

#### **PATCH /api/sessions/[id]**
Update session with new files or generated content.

```bash
curl -X PATCH http://localhost:3000/api/sessions/abc123 \
  -H "Content-Type: application/json" \
  -d '{"notes": "New notes..."}'
```

#### **DELETE /api/sessions/[id]**
Delete a specific session.

```bash
curl -X DELETE http://localhost:3000/api/sessions/abc123
```

#### **DELETE /api/sessions**
Delete all sessions.

```bash
curl -X DELETE http://localhost:3000/api/sessions
```

### Content Generation

#### **POST /api/generate**
Generate content for multiple modes.

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123",
    "modes": ["notes", "flashcards", "quiz", "podcast"],
    "topic": "Photosynthesis",
    "complexity": 60,
    "tweak": "Focus on the light-dependent reactions"
  }'
```

**Request body:**
| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Session ID to update |
| `modes` | string[] | Modes to generate: `notes`, `flashcards`, `quiz`, `podcast`, `quest`, `visual` |
| `topic` | string | Topic for generation |
| `complexity` | number | 0-100 (0=ELI5, 100=Post-graduate) |
| `continueQuest` | object | For continuing quest stories |
| `tweak` | string | User refinement instruction |

**Response:**
```json
{
  "results": [
    { "mode": "notes", "success": true },
    { "mode": "flashcards", "success": true },
    { "mode": "quiz", "success": true },
    { "mode": "podcast", "success": true }
  ]
}
```

#### **POST /api/generate/podcast**
Quick endpoint for podcast generation (simplified).

```bash
curl -X POST http://localhost:3000/api/generate/podcast \
  -H "Content-Type: application/json" \
  -d '{"topic": "Climate Change", "complexity": 50}'
```

---

## 📂 File Handling

### Supported File Types

| Type | Extensions | Processing |
|------|-----------|------------|
| PDF | `.pdf` | PyPDF2 + text extraction |
| Word | `.docx`, `.doc` | Mammoth (DOCX) / Apache POI (DOC) |
| Text | `.txt` | Direct read |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif` | Tesseract OCR |
| Audio | `.mp3`, `.wav`, `.m4a` | Whisper (transcription) |
| Video | `.mp4`, `.webm` | Video metadata extraction |

**File Parser** (`backend/src/fileParser.ts`):
- Extracts text content from all file types
- Returns structured: `{ type: "pdf" | "docx" | ..., content: "..." }`
- Graceful error handling with fallback content

---

## 🧪 Testing Without API Keys

The system gracefully handles missing API keys:

```bash
# Set dummy keys in .env.local
ELEVENLABS_API_KEY="dummy"
SMART_GATEWAY_API_KEY="dummy"
```

**What works:**
- ✅ File upload and extraction
- ✅ Session CRUD
- ✅ UI rendering
- ✅ Mock content generation (for testing)

**What's disabled:**
- ❌ Real AI generation (uses mock content instead)
- ❌ Audio synthesis (silent placeholder audio)

---

## 📊 Database Schema

The Prisma schema defines two main models:

### User Model
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  sessions  Session[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Session Model
```prisma
model Session {
  id              String   @id @default(cuid())
  userId          String?  // Optional: for multi-user support
  title           String   // Session title (AI-generated if not provided)
  date            String   // Date created
  lastStudied     String   // When last accessed
  progress        Int      // Overall progress 0-100
  
  // Material counts
  pdfCount        Int      @default(0)
  audioCount      Int      @default(0)
  videoCount      Int      @default(0)
  imageCount      Int      @default(0)
  files           String?  // JSON array of file metadata
  
  // Generated content (stored as strings, some as JSON)
  notes           String?  // Markdown notes
  flashcards      String?  // JSON: [{front, back}]
  quiz            String?  // JSON: [{question, options, answer_index, explanation}]
  quest           String?  // JSON: interactive RPG state
  podcast         String?  // JSON: {title, script, audioUrl} or base64 audio
  visual          String?  // JSON: mind map data structure
  
  // Progress tracking per mode
  notesProgress   Int      @default(0)
  flashcardsProgress Int   @default(0)
  quizProgress    Int      @default(0)
  questProgress   Int      @default(0)
  podcastProgress Int      @default(0)
  visualProgress  Int      @default(0)
  audioProgress   Int      @default(0)
  
  activeModes     String?  // Comma-separated: "notes,flashcards,quiz"
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database: Create/apply migrations
npm run db:migrate

# Database: Open Prisma Studio UI
npx prisma studio

# Database: Generate Prisma client
npx prisma generate

# Backend: Run tests (if configured)
npm test
```

---

## 🚀 Deployment

### Vercel (Recommended for Next.js)

1. **Connect GitHub repo** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` (LibSQL/Turso URL)
   - `SMART_GATEWAY_URL` & `SMART_GATEWAY_API_KEY`
   - `ELEVENLABS_API_KEY`
3. **Deploy**:
   ```bash
   # Automatic on push to main
   ```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup for Production

**Recommended for deployment:**
```env
DATABASE_URL="libsql://your-db.turso.io?authToken=..."  # Use cloud DB
NODE_ENV="production"
SMART_GATEWAY_URL="https://..."                          # Production endpoint
ELEVENLABS_API_KEY="sk_..."
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: ENOENT: no such file or directory, open 'backend/prisma/dev.db'
```

**Fix:**
```bash
# Create the directory if needed
mkdir -p backend/prisma

# Run migrations
npm run db:migrate
```

### Continuum API Not Responding
```
Error: Continuum returned 401: Unauthorized
```

**Check:**
1. Is `SMART_GATEWAY_URL` correct?
2. Is `SMART_GATEWAY_API_KEY` valid?
3. Is the Gateway service running?

**Test:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"test"}]}'
```

### ElevenLabs Audio Not Generating
```
[AI.Audio] ElevenLabs key missing or dummy, skipping audio generation.
```

**Check:**
1. Is `ELEVENLABS_API_KEY` set in `.env.local`?
2. Is the key valid? (Check https://elevenlabs.io/account)
3. Do you have API quota remaining?

---

## 📚 Additional Resources

- **Continuum Documentation**: https://docs.continuum.shyftlabs.io/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **ElevenLabs API Docs**: https://elevenlabs.io/docs/api-reference
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ Setup Checklist

- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure `DATABASE_URL` (default SQLite works)
- [ ] Set `ELEVENLABS_API_KEY`
- [ ] Set `SMART_GATEWAY_URL` & `SMART_GATEWAY_API_KEY` (optional)
- [ ] Run `npm run db:migrate`
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Test upload a PDF or create a session
- [ ] Verify generation works (or uses mock fallback)

---

**Questions?** Check the logs in the browser console or terminal for detailed error messages.
