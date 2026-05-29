#!/bin/bash
# Database initialization script for Flux AI Learning Studio

set -e

echo "🔧 Initializing Flux AI Learning Studio..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from .env.local.example..."
  cp .env.local.example .env.local
  echo "✅ Created .env.local - please update with your API keys"
  echo ""
fi

# Create database directory if it doesn't exist
echo "📁 Setting up database directory..."
mkdir -p backend/prisma

# Check if database exists
if [ ! -f backend/prisma/dev.db ]; then
  echo "🗄️  Creating new database..."
else
  echo "🗄️  Database exists, running migrations..."
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init || true

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Database initialization complete!"
echo ""
echo "📊 Database location: backend/prisma/dev.db"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys:"
echo "   - ELEVENLABS_API_KEY"
echo "   - SMART_GATEWAY_URL & SMART_GATEWAY_API_KEY (optional)"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000"
echo ""
