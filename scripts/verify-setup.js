// Quick verification that the backend is set up correctly
// Run with: node scripts/verify-setup.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Verifying Flux AI Backend Setup...\n');

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, condition, message = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (message) console.log(`   └─ ${message}`);
    failed++;
  }
}

function warn(name, message = '') {
  console.log(`⚠️  ${name}`);
  if (message) console.log(`   └─ ${message}`);
  warnings++;
}

// Check file structure
console.log('📁 Project Structure:');
check('package.json exists', fs.existsSync(path.join(rootDir, 'package.json')));
check('tsconfig.json exists', fs.existsSync(path.join(rootDir, 'frontend', 'tsconfig.json')));
check('Prisma schema exists', fs.existsSync(path.join(rootDir, 'backend', 'prisma', 'schema.prisma')));

// Check environment
console.log('\n📝 Environment Configuration:');
const envExists = fs.existsSync(path.join(rootDir, '.env.local'));
envExists ? check('.env.local exists', true) : warn('.env.local missing', 'Copy .env.local.example and configure your keys');

// Check API routes
console.log('\n🔌 API Routes:');
const apiDir = path.join(rootDir, 'frontend', 'src', 'app', 'api');
const hasSessionsAPI = fs.existsSync(path.join(apiDir, 'sessions'));
const hasGenerateAPI = fs.existsSync(path.join(apiDir, 'generate'));

check('Sessions API routes exist', hasSessionsAPI && 
  fs.existsSync(path.join(apiDir, 'sessions', 'route.ts')) &&
  fs.existsSync(path.join(apiDir, 'sessions', '[id]', 'route.ts')));
check('Generate API routes exist', hasGenerateAPI &&
  fs.existsSync(path.join(apiDir, 'generate', 'route.ts')));

// Check backend modules
console.log('\n🧠 Backend Modules:');
check('ai.ts exists', fs.existsSync(path.join(rootDir, 'backend', 'src', 'ai.ts')));
check('prisma.ts exists', fs.existsSync(path.join(rootDir, 'backend', 'src', 'prisma.ts')));
check('fileParser.ts exists', fs.existsSync(path.join(rootDir, 'backend', 'src', 'fileParser.ts')));

// Check node_modules
console.log('\n📦 Dependencies:');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
check('ElevenLabs SDK installed', '@elevenlabs/elevenlabs-js' in pkg.dependencies);
check('Prisma installed', 'prisma' in pkg.devDependencies);
check('Next.js installed', 'next' in pkg.dependencies);
check('Tailwind CSS installed', 'tailwindcss' in pkg.devDependencies);

// Check database
console.log('\n🗄️  Database:');
const dbPath = path.join(rootDir, 'backend', 'prisma', 'dev.db');
const dbExists = fs.existsSync(dbPath);
dbExists ? check('SQLite database exists', true) : warn('Database not initialized', 'Run: npm run db:migrate');

if (dbExists) {
  const stats = fs.statSync(dbPath);
  console.log(`   └─ Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   └─ Created: ${stats.birthtime.toLocaleString()}`);
}

// Check migrations
console.log('\n🔄 Migrations:');
const migrationsDir = path.join(rootDir, 'backend', 'prisma', 'migrations');
const migrations = fs.existsSync(migrationsDir) ? 
  fs.readdirSync(migrationsDir).filter(f => !f.startsWith('.')).length : 0;
migrations > 0 ? 
  check(`Migrations exist (${migrations} total)`, true) : 
  warn('No migrations found', 'Run: npm run db:migrate');

// Summary
console.log('\n' + '─'.repeat(50));
console.log('📋 SUMMARY');
console.log('─'.repeat(50));
console.log(`\n✅ Passed: ${passed}`);
if (failed > 0) console.log(`❌ Failed: ${failed}`);
if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n✨ Backend setup looks good! Ready to develop.\n');
  console.log('Quick start:');
  console.log('  1. npm run dev                    # Start development server');
  console.log('  2. npx prisma studio              # View/manage database');
  console.log('  3. http://localhost:3000          # Open in browser\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the failed checks above.\n');
  process.exit(1);
}
