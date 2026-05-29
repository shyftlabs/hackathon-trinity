# Flux AI Backend API Reference

## Overview

The Flux AI Learning Studio backend provides a comprehensive REST API for managing study sessions and generating AI-powered study materials. All API routes are built with Next.js and integrate with:

- **Prisma ORM** - Database abstraction
- **SQLite/LibSQL** - Data persistence  
- **Continuum Smart Inference** - Multi-LLM routing
- **ElevenLabs** - Text-to-speech synthesis

## Base URL

```
http://localhost:3000/api
```

All endpoints are relative to this base URL.

---

## Session Management

### 1. List All Sessions

**GET** `/sessions`

Retrieve all study sessions from the database.

**Query Parameters:** None

**Example:**
```bash
curl http://localhost:3000/api/sessions
```

**Success Response (200):**
```json
[
  {
    "id": "clfx7yqzk0000qqzk0000",
    "title": "Quantum Mechanics 101",
    "date": "May 29",
    "lastStudied": "Just now",
    "materials": {
      "pdfs": 1,
      "audio": 0,
      "video": 0,
      "image": 0
    },
    "activeModes": ["notes", "flashcards", "quiz"],
    "createdAt": "2026-05-29T10:30:00.000Z"
  }
]
```

**Note:** If database is empty, mock sessions are auto-seeded.

---

### 2. Create New Session

**POST** `/sessions`

Create a new study session with file uploads.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Session title (auto-generated if not provided) |
| `files` | File[] | No | Documents to process (PDF, DOCX, images, audio, video) |
| `activeModes` | JSON string | No | Study modes: `["notes", "flashcards", "quiz", "podcast", "quest", "visual"]` |

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -F "title=Biology Fundamentals" \
  -F "activeModes=[\"notes\",\"flashcards\"]" \
  -F "files=@chapter1.pdf" \
  -F "files=@diagram.png"
```

**Example using JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('title', 'Biology Fundamentals');
formData.append('activeModes', JSON.stringify(['notes', 'flashcards']));
formData.append('files', pdfFile);
formData.append('files', imageFile);

const response = await fetch('/api/sessions', {
  method: 'POST',
  body: formData
});

const session = await response.json();
console.log(`Created session: ${session.id}`);
```

**Success Response (200):**
```json
{
  "id": "clfx7yqzk0001qqzk0001",
  "title": "Biology Fundamentals",
  "modes": ["notes", "flashcards"],
  "topic": "Biology Fundamentals"
}
```

**Error Response (400):**
```json
{ "error": "Missing required fields" }
```

---

### 3. Get Session Details

**GET** `/sessions/[id]`

Retrieve a specific session with all generated content.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Session ID |

**Example:**
```bash
curl http://localhost:3000/api/sessions/clfx7yqzk0001qqzk0001
```

**Success Response (200):**
```json
{
  "id": "clfx7yqzk0001qqzk0001",
  "title": "Biology Fundamentals",
  "date": "May 29",
  "lastStudied": "Just now",
  "materials": {
    "pdfs": 1,
    "audio": 0,
    "video": 0,
    "image": 1
  },
  "activeModes": ["notes", "flashcards"],
  "notes": "# Biology Fundamentals\n\n## Introduction\n...",
  "flashcards": {
    "flashcards": [
      {
        "front": "What is photosynthesis?",
        "back": "The process by which plants convert light energy into chemical energy..."
      }
    ]
  },
  "quiz": null,
  "quest": null,
  "podcast": null,
  "visual": null,
  "files": [
    { "name": "chapter1.pdf", "type": "application/pdf" }
  ]
}
```

**Error Responses:**
- **404** - Session not found
- **500** - Server error

---

### 4. Update Session

**PATCH** `/sessions/[id]`

Update a session with new content or files.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Session ID |

**Content-Type:** `application/json` or `multipart/form-data`

**JSON Body Example:**
```json
{
  "notes": "Updated notes content",
  "flashcards": [
    { "front": "Q1", "back": "A1" },
    { "front": "Q2", "back": "A2" }
  ],
  "quiz": { "questions": [...] }
}
```

**Multipart Form Example (add files):**
```bash
curl -X PATCH http://localhost:3000/api/sessions/clfx7yqzk0001qqzk0001 \
  -F "files=@additional_file.pdf"
```

**Success Response (200):**
```json
{ "success": true, "id": "clfx7yqzk0001qqzk0001" }
```

---

### 5. Delete Session

**DELETE** `/sessions/[id]`

Delete a specific session.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Session ID |

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/sessions/clfx7yqzk0001qqzk0001
```

**Success Response (200):**
```json
{ "message": "Session deleted successfully" }
```

---

### 6. Delete All Sessions

**DELETE** `/sessions`

Delete all sessions from the database.

⚠️ **Warning:** This cannot be undone!

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/sessions
```

**Success Response (200):**
```json
{ "message": "All sessions deleted successfully" }
```

---

## Content Generation

### 1. Generate Content for Multiple Modes

**POST** `/generate`

Generate study materials for one or more modes.

**Request Body:**
```json
{
  "sessionId": "clfx7yqzk0001qqzk0001",
  "modes": ["notes", "flashcards", "quiz", "podcast"],
  "topic": "Photosynthesis",
  "complexity": 65,
  "continueQuest": null,
  "tweak": "Focus on the electron transport chain"
}
```

**Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | Session to update with results |
| `modes` | string[] | Yes | Modes to generate: `notes`, `flashcards`, `quiz`, `podcast`, `quest`, `visual`, `audio` |
| `topic` | string | Yes | Topic for generation |
| `complexity` | number | No | 0-100 (0=ELI5, 100=PhD level). Default: 50 |
| `continueQuest` | object | No | For continuing a quest story. Structure: `{choice: string, previousStory: string, step: number}` |
| `tweak` | string | No | User refinement: "Focus on X" or "Simplify the explanation" |

**Examples:**

```bash
# Basic generation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clfx7yqzk0001qqzk0001",
    "modes": ["notes", "flashcards"],
    "topic": "Climate Change",
    "complexity": 50
  }'

# Advanced with tweaks
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clfx7yqzk0001qqzk0001",
    "modes": ["notes", "quiz", "podcast"],
    "topic": "Quantum Computing",
    "complexity": 75,
    "tweak": "Use simple analogies that a high school student can understand"
  }'

# Continue a quest
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clfx7yqzk0001qqzk0001",
    "modes": ["quest"],
    "topic": "Ancient Rome",
    "complexity": 60,
    "continueQuest": {
      "choice": "Enter the Roman Forum",
      "previousStory": "You find yourself in ancient Rome...",
      "step": 1
    }
  }'
```

**Success Response (200):**
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

**Error Response (400):**
```json
{ "error": "Missing required fields" }
```

**Generation Status Tracking:**

Monitor the response to see which modes succeeded/failed:

```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'abc123',
    modes: ['notes', 'flashcards', 'quiz', 'podcast'],
    topic: 'Photosynthesis',
    complexity: 60
  })
});

const { results } = await response.json();

results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.mode} generated successfully`);
  } else {
    console.error(`❌ ${result.mode} failed: ${result.error}`);
  }
});
```

---

### 2. Quick Podcast Generation

**POST** `/generate/podcast`

Quick endpoint for podcast generation (simplified API).

**Request Body:**
```json
{
  "topic": "Climate Change",
  "complexity": 50
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate/podcast \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Machine Learning",
    "complexity": 65
  }'
```

**Success Response (200):**
```json
{
  "result": {
    "title": "Episode Title",
    "script": "Podcast script text...",
    "audioUrl": "data:audio/mpeg;base64,..."
  }
}
```

---

## Study Modes Explained

### Notes
AI-generated Markdown study notes with structure, definitions, and examples.

```json
{
  "result": "# Topic Name\n## Section 1\n...",
  "contentType": "markdown"
}
```

### Flashcards
Multiple-choice style flashcards for active recall practice.

```json
{
  "result": {
    "flashcards": [
      { "front": "What is X?", "back": "Definition of X..." },
      { "front": "Why does Y happen?", "back": "Because..." }
    ]
  },
  "contentType": "json"
}
```

### Quiz
Multiple-choice quiz with explanations for learning.

```json
{
  "result": {
    "quiz": [
      {
        "question": "What is...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer_index": 1,
        "explanation": "The correct answer is B because..."
      }
    ]
  },
  "contentType": "json"
}
```

### Podcast
Audio script + synthesized speech using ElevenLabs.

```json
{
  "result": {
    "title": "Episode Title",
    "script": "Conversational script for audio...",
    "audioUrl": "data:audio/mpeg;base64,SUQzBAA..."
  },
  "contentType": "json"
}
```

### Quest
Interactive text-adventure RPG based on study content.

```json
{
  "result": {
    "story": "You enter an ancient library...",
    "visual": "Description of scene for image generation",
    "options": ["Go left", "Go right", "Look around"],
    "step": 1
  },
  "contentType": "json"
}
```

### Visual
Mind map or knowledge graph structure.

```json
{
  "result": {
    "root": {
      "id": "root",
      "label": "Main Topic",
      "description": "...",
      "children": [...]
    }
  },
  "contentType": "json"
}
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing fields, invalid input) |
| 404 | Resource not found |
| 500 | Server error |

**Error Response Format:**
```json
{ "error": "Description of what went wrong" }
```

**JavaScript Error Handling:**
```javascript
async function safeApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle error appropriately in UI
  }
}
```

---

## Rate Limiting & Quotas

- **ElevenLabs**: Character limits based on plan (free: 10k chars/month)
- **Continuum**: Token limits based on model and plan
- **Database**: SQLite max file size ~2GB (upgrade to LibSQL for unlimited)

**Handling Quota Errors:**
```javascript
if (error.includes('quota') || error.includes('limit')) {
  // Show user-friendly message about API limits
  console.error('API quota exceeded, try again later');
}
```

---

## Webhooks & Events (Future)

The API doesn't currently support webhooks, but long-running generation tasks are handled via:
- **GET `/sessions/[id]`** - Poll for completion
- Check if `result` field changes from null to actual content

```javascript
async function waitForGeneration(sessionId, mode, maxWaitMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const session = await fetch(`/api/sessions/${sessionId}`).then(r => r.json());
    if (session[mode]) {
      return session[mode]; // Generation complete
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
  }
  throw new Error(`Generation timeout for ${mode}`);
}
```

---

## CORS Configuration

By default, the API accepts requests from the same origin. For cross-origin requests, configure in `next.config.ts`:

```typescript
// Typically not needed for same-origin requests
```

---

## Authentication (Future)

Currently, there's no authentication. For multi-user support, implement:
- JWT tokens in headers
- User context in Prisma queries
- Session isolation by `userId`

---

## Examples & Code Snippets

### Create Session and Generate Content
```javascript
// 1. Create session
const files = [pdfFile, imageFile];
const formData = new FormData();
files.forEach(f => formData.append('files', f));
formData.append('title', 'My Study Topic');
formData.append('activeModes', JSON.stringify(['notes', 'flashcards', 'quiz']));

const createResp = await fetch('/api/sessions', {
  method: 'POST',
  body: formData
});
const { id: sessionId } = await createResp.json();

// 2. Generate content
const genResp = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    modes: ['notes', 'flashcards', 'quiz'],
    topic: 'Extracted topic from files',
    complexity: 60
  })
});

const { results } = await genResp.json();
console.log('Generation Results:', results);

// 3. Fetch updated session
const session = await fetch(`/api/sessions/${sessionId}`).then(r => r.json());
console.log('Generated Notes:', session.notes);
console.log('Flashcards:', session.flashcards);
```

### Handle Different Modes
```javascript
async function handleModeResult(mode, result) {
  switch(mode) {
    case 'notes':
      // Render Markdown
      return renderMarkdown(result);
    
    case 'flashcards':
      // Show card UI
      return showFlashcardUI(result.flashcards);
    
    case 'podcast':
      // Play audio
      return playAudio(result.audioUrl);
    
    case 'quest':
      // Show story + choices
      return showQuestUI(result.story, result.options);
    
    case 'visual':
      // Draw mind map
      return drawMindMap(result.root);
    
    default:
      return null;
  }
}
```

---

## Support & Debugging

- **Check logs**: Look at terminal output where `npm run dev` is running
- **Database**: `npx prisma studio` to inspect data
- **API Testing**: Use Postman, Insomnia, or REST Client extension
- **Network**: Check browser DevTools → Network tab for request/response

---

Last Updated: May 29, 2026
