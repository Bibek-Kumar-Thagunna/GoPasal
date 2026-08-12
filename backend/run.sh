#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting GoPasal Backend Setup..."

# 1. Kill any process running on port 3000
echo "🧹 Cleaning up port 3000..."
# Use || true to prevent script exit if no process is found
PID=$(lsof -t -i:3000 || true)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port 3000..."
  kill -9 $PID || true
else
  echo "Port 3000 is free."
fi

# 2. Check Database Connection & Migrations
echo "📦 Checking database and migrations..."
if ! bun run db:migrate; then
  echo "❌ Migration failed. Is PostgreSQL running on port 5433?"
  exit 1
fi

# 3. Start the Server
echo "✅ Setup complete. Starting server..."
echo "---------------------------------------------------"
echo "📄 Swagger UI: http://localhost:3000/docs"
echo "❤️  Health Check: http://localhost:3000/health"
echo "---------------------------------------------------"

# Run in development mode
bun run dev
