# GoPasal Backend

## Overview
GoPasal is a high-performance hyperlocal marketplace backend built with **Elysia.js**, **Drizzle ORM**, and **PostgreSQL**.

## Features
- **Multi-Tenant eCommerce**: Stores, Products, Variants, Inventory.
- **FinTech**: Double-entry Ledger, Escrow, Split Payments.
- **Logistics**: Rider Management, Delivery Tracking, COD.
- **AdTech**: Bidding Engine, Campaign Management.
- **AI & Video**: L1 Support Bot, Product Video Stories.
- **Group Ordering**: Shared Carts with Locking.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) v1.0+
- PostgreSQL 15+ (with `pgvector` extension)

### Installation
```bash
# 1. Install dependencies
bun install

# 2. Setup Environment
cp .env.example .env

# 3. Database Migration
bun run db:migrate

# 4. Seed Data (Optional)
bun run db:seed

# 5. Start Server
bun run dev
```

## Architecture
The project follows a **Modular Monolith** pattern:
- `src/modules/*`: Domain-specific logic (Controller, Service, Types).
- `src/db/schema/*`: Drizzle schema definitions.
- `src/config/*`: Centralized configuration.

## APIs
- **Swagger UI**: Visit `http://localhost:3000/swagger` for full API docs.
- **Public**: `/catalog`, `/auth`, `/support`.
- **Protected**: `/orders`, `/cart`, `/payments`.
- **Admin**: `/admin`, `/flags`.

## Testing
```bash
# Run Unit Tests
bun test

# Run E2E Tests
bun test src/test/e2e
```

## License
Proprietary.