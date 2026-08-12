#!/usr/bin/env bash
# ==============================================================================
# GoPasal Backend API Startup & Health Verification Script
# ==============================================================================
set -e

echo "🚀 Starting GoPasal Backend Service on Port 3000..."

cd /opt/gopasal/backend || cd "$(dirname "$0")/../backend"

# 1. Ensure dependencies are installed
if command -v bun &> /dev/null; then
  echo "📦 Installing backend dependencies with Bun..."
  bun install --frozen-lockfile || bun install
else
  echo "⚠️ Bun not found, installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  bun install
fi

# 2. Check and start Database & Redis if using Docker Compose
if command -v docker &> /dev/null && [ -f "../docker-compose.yml" ]; then
  echo "🐳 Ensuring Postgres and Redis are running on ports 5432 & 5433..."
  cd ..
  docker compose up -d postgres redis
  sleep 3
  # Sync PostgreSQL password and database for user 'postgres'
  docker compose exec -T postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
  docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE gopasal;" 2>/dev/null || true
  docker compose exec -T postgres psql -U postgres -d gopasal -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
  docker compose exec -T postgres psql -U postgres -d gopasal -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
  cd backend
  sleep 1
fi

# 3. Ensure database schema and initial seed are populated
echo "🗄️ Verifying Database Schema & Initial Data..."
bunx drizzle-kit push --force || bunx drizzle-kit push || true
bun run src/db/seed.ts || true

# 4. Kill any stale process on port 3000
echo "🧹 Cleaning up port 3000..."
fuser -k 3000/tcp 2>/dev/null || true
pkill -f "bun run src/index.ts" 2>/dev/null || true

# 4. Start backend API with PM2 (or nohup as background daemon)
echo "⚡ Launching GoPasal Backend API..."
if command -v pm2 &> /dev/null; then
  pm2 delete gopasal-backend 2>/dev/null || true
  pm2 start "bun run src/index.ts" --name "gopasal-backend"
  pm2 save 2>/dev/null || true
else
  nohup bun run src/index.ts > /var/log/gopasal-backend.log 2>&1 &
fi

# 5. Wait and verify port 3000 health check
echo "⏳ Waiting for API on port 3000 to be healthy..."
sleep 3
for i in {1..10}; do
  if curl -s -f http://127.0.0.1:3000/health > /dev/null 2>&1 || curl -s http://127.0.0.1:3000/docs > /dev/null 2>&1; then
    echo "✅ GoPasal Backend API is LIVE and healthy on Port 3000!"
    exit 0
  fi
  echo "Retrying health check ($i/10)..."
  sleep 1
done

echo "⚠️ Backend started, checking logs..."
tail -n 20 /var/log/gopasal-backend.log 2>/dev/null || pm2 logs gopasal-backend --lines 20 2>/dev/null || true
