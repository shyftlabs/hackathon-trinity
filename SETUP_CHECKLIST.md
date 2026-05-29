# ✅ Flux AI Backend Setup Checklist

## Pre-Flight Check
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed
- [ ] Have ~5 minutes to set up

## Installation

- [ ] Clone repository (if applicable)
- [ ] `npm install` - Install all dependencies
- [ ] Verify no errors in installation

## Environment Configuration

- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Set `DATABASE_URL` (default SQLite should work)
- [ ] (Optional) Get ElevenLabs API key: https://elevenlabs.io
- [ ] (Optional) Get Continuum credentials: https://continuum.shyftlabs.io

### Environment Variables Needed

**Minimum (for testing):**
```
DATABASE_URL=file:./backend/prisma/dev.db
NODE_ENV=development
```

**Recommended (for features):**
```
DATABASE_URL=file:./backend/prisma/dev.db
ELEVENLABS_API_KEY=sk_...
SMART_GATEWAY_URL=https://...
SMART_GATEWAY_API_KEY=sk_...
NODE_ENV=development
```

- [ ] `.env.local` file created with required variables
- [ ] Validated no secrets in git (add to .gitignore if needed)

## Database Setup

- [ ] Run `npm run db:migrate` to initialize database
- [ ] Verify `backend/prisma/dev.db` file was created
- [ ] (Optional) View database with `npx prisma studio`

## Verification

Run the verification script:
```bash
node scripts/verify-setup.js
```

- [ ] All checks pass (green ✅)
- [ ] API routes are properly configured
- [ ] Dependencies are installed

## Backend Integration

- [ ] API route `/api/sessions` exists
- [ ] API route `/api/generate` exists
- [ ] File parser (`fileParser.ts`) is available
- [ ] AI module (`ai.ts`) loads Continuum + ElevenLabs config
- [ ] Prisma client initialized

## Development Server

- [ ] Run `npm run dev`
- [ ] Server starts without errors
- [ ] Navigate to http://localhost:3000
- [ ] Homepage loads successfully

## Feature Testing

### File Upload & Session Creation
- [ ] Can upload PDF file
- [ ] Can upload image (PNG/JPG)
- [ ] Session is created in database
- [ ] Files are processed and content extracted

### Content Generation
- [ ] Can request notes generation
- [ ] Can request flashcards generation
- [ ] Can request quiz generation
- [ ] (With ElevenLabs key) Can generate podcast/audio
- [ ] Generated content appears in UI

### Session Management
- [ ] Can view session list
- [ ] Can view individual session details
- [ ] Can delete session
- [ ] Can update session with new content

## API Testing (Optional)

Test with curl or Postman:

```bash
# List sessions
curl http://localhost:3000/api/sessions

# Create session
curl -X POST http://localhost:3000/api/sessions \
  -F "title=Test Session" \
  -F "activeModes=[\"notes\"]"

# Generate content
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"...","modes":["notes"],"topic":"Test"}'
```

- [ ] All API endpoints respond correctly
- [ ] Database updates reflect API changes
- [ ] Error handling works as expected

## Documentation Review

- [ ] Read [GETTING_STARTED.md](./GETTING_STARTED.md)
- [ ] Read [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- [ ] Review [API_REFERENCE.md](./API_REFERENCE.md)
- [ ] Understand project structure

## Common Issues & Fixes

### Issue: Port 3000 already in use
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```
- [ ] Server running on accessible port

### Issue: Database migration fails
```bash
# Reset database
npm run db:reset
npm run db:migrate
```
- [ ] Database migrations completed successfully

### Issue: Cannot find module @backend
- [ ] Restart dev server
- [ ] Verify tsconfig.json has correct paths
- [ ] Check frontend/tsconfig.json exists

### Issue: ElevenLabs errors
- [ ] Verify API key is valid
- [ ] Check key has not exceeded quota
- [ ] Ensure key starts with `sk_`

### Issue: Continuum not connecting
- [ ] Verify gateway URL is correct
- [ ] Test API key separately
- [ ] Check network connectivity to gateway

## Production Readiness (Optional)

- [ ] Environment variables secure (no hardcoded secrets)
- [ ] Database backed up (`cp backend/prisma/dev.db backup.db`)
- [ ] Error logging configured (optional)
- [ ] API rate limiting considered
- [ ] CORS configuration reviewed
- [ ] Security headers configured (Vercel/nginx)

## Next Steps

### Immediate
1. ✅ Complete all checks above
2. ✅ Read getting started guide
3. ✅ Create first session and generate content

### Short-term
1. Customize UI in `frontend/src/components/`
2. Add user authentication (if needed)
3. Set up environment for team

### Long-term
1. Deploy to Vercel or Docker
2. Set up CI/CD pipeline
3. Add monitoring and analytics
4. Scale database (migrate to LibSQL/Turso)

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Start dev server | `npm run dev` |
| Init database | `npm run db:migrate` |
| View database UI | `npx prisma studio` |
| Run tests | `npm run test:backend` |
| Verify setup | `node scripts/verify-setup.js` |
| Lint code | `npm run lint` |
| Build for production | `npm run build` |

## Support Resources

- **Documentation**: Read the markdown files in project root
- **Errors**: Check terminal output and browser console
- **Database**: Use `npx prisma studio` to inspect data
- **API Testing**: Use Postman, Insomnia, or REST Client extension

## Final Verification

Run this to confirm everything is working:

```bash
# 1. Verify setup
node scripts/verify-setup.js

# 2. Start server
npm run dev

# 3. Test API (in another terminal)
curl http://localhost:3000/api/sessions

# 4. View database (in another terminal)
npx prisma studio
```

Expected results:
- ✅ Verification script shows all green
- ✅ Dev server starts without errors
- ✅ API returns session list (may be empty)
- ✅ Prisma Studio opens at http://localhost:5555

---

## Completion Checklist

When all items are checked, your backend is fully set up and integrated:

- [ ] Environment variables configured
- [ ] Database initialized and migrations applied
- [ ] Development server running
- [ ] Basic file upload working
- [ ] Content generation functional (with or without API keys)
- [ ] Documentation read and understood
- [ ] API endpoints tested

**Status**: ✅ Ready for development!

---

Last Updated: May 29, 2026
Questions? See [GETTING_STARTED.md](./GETTING_STARTED.md) or [BACKEND_SETUP.md](./BACKEND_SETUP.md)
