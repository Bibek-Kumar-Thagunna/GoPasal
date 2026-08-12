# GoPasal Backend — Project Standards

## Architecture

**Modular monolith** with clear separation of concerns:

```
src/
├── config/          # Environment and app constants
├── db/              # Database connection, schemas, migrations
│   └── schema/      # Drizzle ORM table definitions
├── middlewares/      # Elysia middleware plugins
├── modules/         # Feature modules (controller + service pattern)
│   ├── auth/
│   ├── health/
│   └── rbac/
├── shared/          # Cross-cutting concerns (audit, etc.)
├── types/           # TypeScript types and enums
├── utils/           # Utility functions (logger, crypto, errors)
└── index.ts         # App entry point
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case.ts` | `auth.service.ts` |
| Folders | `kebab-case` | `feature-flags/` |
| Variables/Functions | `camelCase` | `getUserRoles()` |
| Classes | `PascalCase` | `AuthService` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_OTP_ATTEMPTS` |
| Enums | `PascalCase` key, `UPPER_SNAKE_CASE` value | `UserRole.SUPER_ADMIN` |
| DB Tables | `snake_case` | `user_roles` |
| DB Columns | `snake_case` | `created_at` |
| API Paths | `kebab-case` | `/api/v1/auth/otp/send` |

---

## Module Pattern

Every feature module follows this structure:

```
modules/<name>/
├── <name>.controller.ts   # Elysia route definitions
├── <name>.service.ts      # Business logic (no HTTP awareness)
└── index.ts               # Barrel export
```

**Rules:**
- Controllers handle HTTP concerns (request, response, status codes)
- Services handle business logic (database queries, validation)
- Services never access `request` or `set` — they throw errors, controllers catch them
- Services are injected into controllers, never imported statically by other services

---

## API Response Format

All endpoints return a consistent shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Use the helpers**: `success()`, `created()`, `paginated()`, `error()` from `@/utils/response`.

---

## API Versioning

All endpoints must be prefixed with `/api/v1/`. When breaking changes are needed, create `/api/v2/` without removing v1.

---

## Authentication

- **Method**: Phone + OTP → JWT (access + refresh tokens)
- **Access Token**: Short-lived (15 min), sent as `Bearer` header
- **Refresh Token**: Long-lived (7 days), sent in request body
- **Token Rotation**: On refresh, old session is revoked and new tokens are issued
- **Reuse Detection**: If a refresh token is reused after rotation, ALL sessions are revoked

---

## RBAC (Role-Based Access Control)

### Default Roles

| Role | Scope | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform | Full access, bypasses permission checks |
| `PLATFORM_OPERATOR` | Platform | DevOps and monitoring |
| `SELLER_OWNER` | Tenant | Owns and manages a store |
| `SELLER_STAFF` | Tenant | Store employee with scoped permissions |
| `CUSTOMER` | — | End user, browses and orders |
| `DELIVERY_PARTNER` | — | Fulfills delivery tasks |

### Default-Deny Policy

- All routes are **denied by default** unless explicitly allowed
- Use `requireAuth` for authentication
- Use `requireRole("ROLE")` for role checks
- Use `requirePermission("resource:action")` for granular permissions
- `SUPER_ADMIN` bypasses all permission checks

### Permission Format

Permissions follow the `resource:action` pattern:
- `stores:read`, `stores:write`, `stores:delete`, `stores:approve`
- `orders:read`, `orders:write`, `orders:cancel`

---

## Tenant Isolation

- Every store is a **tenant**
- Tenant-scoped data must include `tenantId` checks
- Use `enforceTenantIsolation()` in services before returning data
- Use `requireTenant()` middleware for routes that require tenant context
- `SUPER_ADMIN` and `PLATFORM_OPERATOR` can access cross-tenant data

---

## Database Conventions

- Use **Drizzle ORM** for all database operations
- Schema files in `src/db/schema/`, one file per table group
- Every table must have `id` (nanoid), `createdAt`, `updatedAt`
- Use `text("id")` instead of auto-increment for IDs
- Add indexes for frequently queried columns
- Foreign keys with `onDelete: "cascade"` where appropriate
- Migrations via `bun run db:generate` + `bun run db:migrate`

---

## Error Handling

- Throw `AppError` subclasses for expected errors
- The global `errorHandler` middleware catches and formats them
- Never expose stack traces or internal errors in API responses
- Error classes: `AuthError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ValidationError` (422), `ConflictError` (409), `RateLimitError` (429), `TenantError` (403)

---

## Audit Logging

All state-changing operations must be audit-logged using `createAuditLog()`:

```typescript
await createAuditLog({
  actorId: auth.userId,
  action: "UPDATE",
  resource: "stores",
  resourceId: storeId,
  beforeState: existingStore,
  afterState: updatedStore,
});
```

Required fields: `action`, `resource`. Include `beforeState`/`afterState` for mutations.

---

## Environment Variables

- All env vars are validated at startup in `src/config/env.ts`
- Missing required vars cause immediate process exit
- Never hardcode secrets — always use env vars
- `.env` is gitignored; `.env.example` is committed

---

## Git Conventions

- **Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- **Branches**: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- No force pushes to `main`

---

## CRUD Endpoint Standard

Every resource module must implement these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/<resource>` | List with pagination |
| `GET` | `/api/v1/<resource>/:id` | Get by ID |
| `POST` | `/api/v1/<resource>` | Create |
| `PUT` | `/api/v1/<resource>/:id` | Update |
| `DELETE` | `/api/v1/<resource>/:id` | Delete |

Pagination query params: `page`, `limit`, `sortBy`, `sortOrder`. Use `buildPaginationMeta()` for response.

---

## Code Review Checklist

- [ ] Input validated via Elysia TypeBox schemas
- [ ] Auth middleware applied to protected routes
- [ ] RBAC permissions checked
- [ ] Tenant isolation enforced for tenant-scoped data
- [ ] Audit log created for state changes
- [ ] Error handling uses AppError subclasses
- [ ] No hardcoded secrets
- [ ] Consistent API response format
- [ ] Database indexes for query patterns
