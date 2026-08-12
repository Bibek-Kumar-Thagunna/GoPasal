# GoPasal Monorepo Development Guide

## Overview

GoPasal is organized as a multi-app monorepo:
- **`backend/`**: Elysia.js + Bun + Drizzle ORM (PostgreSQL + PostGIS + pgvector)
- **`apps/customer/`**: Customer Mobile & Web App (Expo SDK 54 / React Native)
- **`apps/seller/`**: Seller Merchant Terminal (Expo SDK 54 / React Native)
- **`apps/admin-web/`**: Super Admin Web Console (Next.js 15 + Tailwind)
- **`apps/admin/`**: Super Admin Mobile Terminal (Expo SDK 54)
- **`apps/delivery/`**: Rider Delivery App (Expo SDK 54)

---

## Quick Start

### Run the Complete Stack
```bash
# Start backend + core apps
npm run dev:stack

# Or run backend + seller concurrently
npm run dev:all
```

---

## Running Applications Individually

### 1. Backend (API & Realtime SSE)
```bash
cd backend
bun install
bun run dev
# API: http://localhost:3000
# OpenAPI Docs: http://localhost:3000/docs
```

### 2. Customer App (Web & Mobile)
```bash
# Web preview (Port 8081)
npm run dev:customer

# iOS / Android native preview
cd apps/customer && npx expo start
```

### 3. Seller App
```bash
# Web preview (Port 8082)
npm run dev:seller

# Native
cd apps/seller && npx expo start
```

### 4. Admin Web Portal
```bash
# Next.js 15 Admin Console (Port 8083)
npm run dev:admin
```

### 5. Delivery Rider App
```bash
# Delivery Rider App
npm run dev:delivery
```

---

## Testing & Quality Assurance

### Run Backend Tests
```bash
cd backend && bun test
```

### Typecheck All Apps
```bash
cd backend && bun x tsc --noEmit
cd apps/customer && npx tsc --noEmit
cd apps/seller && npx tsc --noEmit
cd apps/admin-web && npx tsc --noEmit
cd apps/delivery && npx tsc --noEmit
cd apps/admin && npx tsc --noEmit
```

### Secrets Scan
```bash
bash scripts/check-secrets.sh
```

---

## Docker Production Deployment

```bash
# 1. Prepare environment
cp backend/.env.example backend/.env
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export REDIS_PASSWORD=$(openssl rand -hex 16)

# 2. Build & run stack
docker compose up -d --build
```
