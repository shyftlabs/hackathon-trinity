# 🎯 Flux AI Learning Studio - Getting Started

Welcome to Flux! This guide will get you up and running in under 5 minutes.

## What is Flux?

Flux is an AI-powered learning platform that transforms your study materials into interactive study modes:
- 📝 **Notes** - Smart, organized study notes
- 📇 **Flashcards** - Active recall practice
- 🎯 **Quiz** - Self-assessment with explanations
- 🎮 **Quest** - Interactive RPG learning game
- 🎙️ **Podcast** - Audio summaries with text-to-speech
- 🗺️ **Visual** - Mind maps and knowledge graphs

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your API keys
# For testing, you can leave dummy values
```

### Step 3: Initialize Database
```bash
npm run setup
# or manually:
npm run db:migrate
```

### Step 4: Start Development Server
```bash
npm run dev
```

Visit **http://localhost:3000** in your browser.

## Configuration

### Minimal Setup (Testing/Demo)
To get started without API keys (will use mock content):

```bash
# .env.local
DATABASE_URL="file:./backend/prisma/dev.db"
ELEVENLABS_API_KEY="dummy"
SMART_GATEWAY_API_KEY="dummy"
NODE_ENV="development"
```

### Full Setup (Production Features)

Get real API keys from:

1. **ElevenLabs** (Text-to-Speech)
   - Go to https://elevenlabs.io
   - Sign up and get your API key
   - Add to `.env.local`: `ELEVENLABS_API_KEY="sk_..."`

2. **Continuum** (Smart AI Inference)
   - Set up your Continuum Gateway or use ShyftLabs
   - Add to `.env.local`:
     ```
     SMART_GATEWAY_URL="https://your-gateway-url/v1/chat/completions"
     SMART_GATEWAY_API_KEY="sk_..."
     CONTINUUM_MODEL="auto"
     ```

3. **Database** (Optional - SQLite works by default)
   - SQLite is included and works locally
   - For cloud: Use Turso (https://turso.tech)
     ```
     DATABASE_URL="libsql://your-db.turso.io?authToken=..."
     ```

## Project Structure

```
Flux AI Learning Studio
├── frontend/                    # Next.js web app
│   ├── src/app/
│   │   ├── api/               # API routes for backend
│   │   ├── dashboard/         # Main study interface
│   │   ├── student/           # Student view
│   │   └── teacher/           # Teacher view (future)
│   └── components/            # UI components
├── backend/
│   ├── src/
│   │   ├── ai.ts              # AI generation (Continuum + ElevenLabs)
│   │   ├── prisma.ts          # Database client
│   │   └── fileParser.ts      # File extraction
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── dev.db             # SQLite database
│   └── continuum/             # Python agent runtime (optional)
├── BACKEND_SETUP.md           # Complete backend setup guide
├── API_REFERENCE.md           # Full API documentation
└── README.md                  # Project overview
```

## Key Features

### 📁 File Upload Support
- **Documents**: PDF, DOCX, TXT
- **Images**: PNG, JPG, GIF (with OCR)
- **Audio/Video**: MP3, WAV, MP4 (metadata extraction)

### 🧠 AI-Powered Generation
- Smart content extraction from uploaded files
- Multi-mode generation with single request
- Configurable complexity (0-100)
- Tweak/refine outputs on demand
- Graceful fallback to mock content if APIs unavailable

### 📊 Session Management
- Create sessions with custom titles
- Upload multiple files per session
- Track progress across study modes
- Persistent storage with Prisma + SQLite

### 🎵 Audio Features
- ElevenLabs text-to-speech synthesis
- 29+ language support
- Multiple voice options
- Base64 encoded audio data (no external URLs)

## Common Tasks

### View the Database
```bash
npx prisma studio
```
Opens a web UI at http://localhost:5555

### Create New Session via API
```bash
curl -X POST http://localhost:3000/api/sessions \
  -F "title=My Study Topic" \
  -F "activeModes=[\"notes\",\"flashcards\"]" \
  -F "files=@document.pdf"
```

### Generate Study Materials
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123",
    "modes": ["notes", "flashcards", "quiz"],
    "topic": "Photosynthesis",
    "complexity": 60
  }'
```

### Reset Database
```bash
npm run db:reset
# WARNING: Deletes all data!
```

## Troubleshooting

### "Database not found" error
```bash
npm run db:migrate
```

### "Cannot find @backend" error
- Restart dev server: `npm run dev`
- Check tsconfig.json has `@backend` alias

### API returning mock content
- Check your `.env.local` has valid API keys
- Verify API endpoints are reachable
- Check browser console for detailed errors

### File upload not working
- Ensure file size < 50MB
- Check file type is supported
- Look for errors in terminal

## Project Documentation

- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Complete backend configuration
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Full API endpoint documentation
- **[README.md](./README.md)** - Project overview

## Technologies

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Framer Motion
- Shadcn/UI

**Backend:**
- Node.js / TypeScript
- Prisma ORM
- SQLite / LibSQL
- ElevenLabs SDK
- Continuum Smart Gateway

**Optional:**
- Python (Continuum agent runtime)
- Docker (for deployment)

## Development Workflow

1. **Make changes** to code
2. **Hot reload** automatically applied
3. **Test API** with curl or Postman
4. **View DB** with `npx prisma studio`
5. **Commit** with clear messages

## Deployment

### To Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### To Docker
```bash
docker build -t flux-ai .
docker run -p 3000:3000 -e DATABASE_URL="..." flux-ai
```

## Next Steps

1. ✅ Complete the quick start above
2. 📖 Read [BACKEND_SETUP.md](./BACKEND_SETUP.md) for details
3. 🧪 Test API endpoints with [API_REFERENCE.md](./API_REFERENCE.md)
4. 🎨 Customize UI in `frontend/src/components/`
5. 🚀 Deploy to production

## Support

- **Issues?** Check the troubleshooting section above
- **Questions?** Read the documentation files
- **Errors?** Look at terminal logs and browser console
- **Contributing?** See [CONTRIBUTING.md](./CONTRIBUTING.md) if available

---

**Happy learning! 🚀**

Need help? Start with [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed configuration guide.
