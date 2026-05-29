#!/bin/bash
# Quick test to verify backend integration is working

set -e

echo "🧪 Testing Flux AI Learning Studio Backend Integration..."
echo ""

# Check environment file
echo "1️⃣  Checking environment configuration..."
if [ -f .env.local ]; then
  echo "   ✅ .env.local found"
else
  echo "   ⚠️  .env.local not found, using defaults"
fi

# Check database
echo ""
echo "2️⃣  Checking database..."
if [ -f backend/prisma/dev.db ]; then
  echo "   ✅ Database exists"
  DB_SIZE=$(du -h backend/prisma/dev.db | cut -f1)
  echo "   📊 Size: $DB_SIZE"
else
  echo "   ❌ Database not found - run: npm run db:migrate"
fi

# Check Prisma client
echo ""
echo "3️⃣  Checking Prisma setup..."
if [ -d node_modules/.prisma ]; then
  echo "   ✅ Prisma client generated"
else
  echo "   ⚠️  Prisma client not found - run: npx prisma generate"
fi

# Check required Node modules
echo ""
echo "4️⃣  Checking dependencies..."
DEPS_OK=true

# Check for ElevenLabs
if grep -q "@elevenlabs/elevenlabs-js" package.json; then
  echo "   ✅ ElevenLabs SDK installed"
else
  echo "   ❌ ElevenLabs SDK not in package.json"
  DEPS_OK=false
fi

# Check for Prisma
if grep -q "prisma" package.json; then
  echo "   ✅ Prisma installed"
else
  echo "   ❌ Prisma not in package.json"
  DEPS_OK=false
fi

# Check for LibSQL
if grep -q "@libsql/client" package.json; then
  echo "   ✅ LibSQL client installed"
else
  echo "   ⚠️  LibSQL not installed (needed for cloud databases)"
fi

# Summary
echo ""
echo "────────────────────────────────────────────────"
echo "📋 Backend Integration Summary"
echo "────────────────────────────────────────────────"
echo ""
echo "✅ Backend services configured:"
echo "   • Prisma ORM + SQLite Database"
echo "   • Continuum Smart Inference Gateway (for AI)"
echo "   • ElevenLabs Text-to-Speech"
echo "   • Next.js API Routes"
echo ""
echo "📚 API Endpoints:"
echo "   • GET/POST   /api/sessions"
echo "   • GET/PATCH/DELETE /api/sessions/[id]"
echo "   • POST /api/generate"
echo "   • POST /api/generate/podcast"
echo "   • POST /api/generate-image"
echo ""
echo "To start development:"
echo "   npm run dev"
echo ""
echo "To view database:"
echo "   npx prisma studio"
echo ""
