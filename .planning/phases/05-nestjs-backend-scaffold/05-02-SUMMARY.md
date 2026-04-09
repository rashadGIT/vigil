---
phase: 05-nestjs-backend-scaffold
plan: 02
subsystem: backend
tags: [nestjs, auth, cognito, prisma, guards, interceptors, multi-tenancy]
dependency_graph:
  requires: [05-01, 04-prisma-schema]
  provides: [prisma-service, cognito-auth-guard, audit-interceptor, health-endpoint, auth-module, users-module]
  affects:
    - backend/src/common/prisma/
    - backend/src/common/guards/
    - backend/src/common/decorators/
    - backend/src/common/interceptors/
    - backend/src/common/filters/
    - backend/src/common/cron/
    - backend/src/modules/auth/
    - backend/src/modules/users/
    - backend/src/modules/health/
    - backend/src/app.module.ts
tech_stack:
  added: []
  patterns:
    - "PrismaService.forTenant(tenantId) — auto-injects tenantId on all non-Tenant model queries"
    - "CognitoAuthGuard as global APP_GUARD with @Public() escape hatch"
    - "DEV_AUTH_BYPASS hard-gated on NODE_ENV !== production"
    - "InternalOnlyGuard for n8n webhook callbacks via x-vigil-internal-key header"
    - "AuditLogInterceptor writes POST/PATCH/DELETE to AuditLog table"
    - "HttpExceptionFilter — sanitized error envelope; stack traces server-side only"
    - "getRedisState() helper pattern to prevent TS literal narrowing on placeholder stubs"
key_files:
  created:
    - backend/src/common/prisma/prisma.service.ts
    - backend/src/common/prisma/prisma.module.ts
    - backend/src/common/decorators/public.decorator.ts
    - backend/src/common/decorators/current-user.decorator.ts
    - backend/src/common/decorators/roles.decorator.ts
    - backend/src/common/decorators/internal-only.decorator.ts
    - backend/src/common/guards/cognito-auth.guard.ts
    - backend/src/common/guards/internal-only.guard.ts
    - backend/src/common/interceptors/audit-log.interceptor.ts
    - backend/src/common/filters/http-exception.filter.ts
    - backend/src/common/cron/cron.module.ts
    - backend/src/modules/auth/auth.service.ts
    - backend/src/modules/auth/auth.controller.ts
    - backend/src/modules/auth/auth.module.ts
    - backend/src/modules/auth/dto/login.dto.ts
    - backend/src/modules/auth/dto/refresh.dto.ts
    - backend/src/modules/users/users.service.ts
    - backend/src/modules/users/users.controller.ts
    - backend/src/modules/users/users.module.ts
    - backend/src/modules/users/dto/create-user.dto.ts
    - backend/src/modules/health/health.controller.ts
    - backend/src/modules/health/health.module.ts
  modified:
    - backend/src/common/cron/cron-stubs.service.ts
    - backend/src/app.module.ts
decisions:
  - "tenantId passed explicitly in UsersService.create() data — forTenant() extension injects at runtime but Prisma type system requires it at compile time"
  - "getRedisState() extracted as a function to prevent TypeScript literal narrowing on 'disabled' placeholder — Phase 8 replaces with real Redis ping"
  - "CognitoAuthGuard skips @InternalOnly() routes — InternalOnlyGuard handles those independently"
  - "refresh token stored as httpOnly cookie scoped to /auth path; 30-day TTL; domain .vigilhq.com in prod"
metrics:
  duration_minutes: 18
  completed_date: "2026-04-09"
  tasks_completed: 12
  files_changed: 24
---

# Phase 05 Plan 02: Auth + Common Layer Summary

**One-liner:** Global CognitoAuthGuard + PrismaService.forTenant() + AuditLogInterceptor + auth/users/health modules wired as a complete, compilable backend foundation.

## What Was Built

The common infrastructure layer that every subsequent module depends on. This plan delivers:

- **PrismaService** extending `PrismaClient` with a `forTenant(tenantId)` method that auto-injects `tenantId` into `where` and `data` on all non-`Tenant` model operations. `UNSCOPED_MODELS = new Set(['Tenant'])` prevents tenantId injection on the Tenant table itself.

- **Four decorators**: `@Public()` (bypasses global guard), `@CurrentUser()` (extracts `AuthUser` from request), `@Roles()` (metadata for future role guard), `@InternalOnly()` (marks n8n webhook routes).

- **CognitoAuthGuard** as global `APP_GUARD`: checks `@Public()` and `@InternalOnly()` first, then DEV_AUTH_BYPASS (hard-gated on `NODE_ENV !== production`), then verifies Cognito JWT via `aws-jwt-verify` and syncs `cognitoSub` to the User record.

- **InternalOnlyGuard**: validates `x-vigil-internal-key` header for n8n webhook callbacks; passthrough on non-`@InternalOnly()` routes.

- **AuditLogInterceptor**: writes to `AuditLog` table on POST/PATCH/DELETE/PUT; derives entity type from route path; swallows DB write failures with a warn log.

- **HttpExceptionFilter**: sanitized `{ statusCode, message, path, timestamp }` envelope; 5xx errors logged server-side only.

- **AuthModule**: `POST /auth/login` (USER_PASSWORD_AUTH → httpOnly refresh cookie), `POST /auth/refresh` (REFRESH_TOKEN_AUTH from cookie), `POST /auth/logout` (GlobalSignOut). No passport, no bcrypt.

- **UsersModule**: `GET /users` (tenant-scoped list), `POST /users` (`@Roles('admin')` — AdminCreateUser + AdminSetUserPassword + Prisma mirror via `forTenant()`).

- **HealthModule**: `GET /health` returning `{ status, db, redis }` — `@Public()` for ECS task definition health check; Redis stub returns `'disabled'` until Phase 8.

- **CronStubsService** upgraded from Phase 2 `export {}` stub to a real `@Injectable()` with `@Cron(EVERY_DAY_AT_9AM)` and production guard.

- **AppModule** wired: `PrismaModule` (global), `AuthModule`, `UsersModule`, `HealthModule`, `CronModule`, plus `APP_GUARD` chain (ThrottlerGuard → CognitoAuthGuard → InternalOnlyGuard), `APP_INTERCEPTOR` (AuditLogInterceptor), `APP_FILTER` (HttpExceptionFilter).

`npx tsc --noEmit` and `npm run build` both pass. `dist/main.js` rebuilt.

## Security Mitigations Applied

| Threat | Mitigation | Location |
|--------|-----------|----------|
| T-05-02 Unauthenticated API access | CognitoAuthGuard as global APP_GUARD; only @Public() bypasses | cognito-auth.guard.ts |
| T-05-03 Cross-tenant data access | forTenant() extension auto-injects tenantId on every non-Tenant query | prisma.service.ts |
| T-05-04 Mutations without audit | AuditLogInterceptor writes POST/PATCH/DELETE to AuditLog | audit-log.interceptor.ts |
| T-05-05 Stack traces leaked | HttpExceptionFilter returns sanitized envelope; 5xx logged server-side | http-exception.filter.ts |
| T-05-06 Webhook endpoints exposed | InternalOnlyGuard checks x-vigil-internal-key | internal-only.guard.ts |
| T-05-07 Auth brute force | @Throttle({ limit: 10, ttl: 60_000 }) on /auth/login | auth.controller.ts |
| T-05-08 DEV_AUTH_BYPASS in prod | Hard-gated on NODE_ENV !== 'production' | cognito-auth.guard.ts |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 05-02-01+02 | f4aa32c | PrismaService with forTenant() + PrismaModule (@Global) |
| 05-02-03 | 90405af | Public, CurrentUser, Roles, InternalOnly decorators |
| 05-02-04 | 1e18f50 | CognitoAuthGuard with DEV_AUTH_BYPASS + cognitoSub sync |
| 05-02-05 | a92b8ca | InternalOnlyGuard for n8n webhook callbacks |
| 05-02-06 | cc85734 | AuditLogInterceptor for POST/PATCH/DELETE mutations |
| 05-02-07 | e292895 | HttpExceptionFilter for sanitized error envelope |
| 05-02-08 | a46fecd | Auth module (login, refresh, logout) |
| 05-02-09 | b966562 | Users module (AdminCreateUser + Prisma mirror) |
| 05-02-10 | e66d029 | Health module (GET /health, ECS probe) |
| 05-02-11 | f37aba8 | CronStubsService upgraded + CronModule |
| 05-02-12 | a2b7687 | Wire all modules + global guards into AppModule |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused @ts-expect-error directive in PrismaService**
- **Found during:** Task 05-02-01 (tsc --noEmit)
- **Issue:** Plan included `// @ts-expect-error` on `arguments[0]?.operation` but TypeScript resolved the type correctly without it, causing TS2578 (unused directive error)
- **Fix:** Replaced with explicit cast `(arguments[0] as { operation?: string } | undefined)?.operation`
- **Files modified:** `backend/src/common/prisma/prisma.service.ts`
- **Commit:** f4aa32c

**2. [Rule 1 - Bug] Added explicit tenantId to UsersService.create() data**
- **Found during:** Task 05-02-09 (tsc --noEmit)
- **Issue:** `forTenant().user.create({ data: { ... } })` without `tenantId` caused TS2322 — Prisma type system requires `tenantId` in data at compile time even though the runtime extension injects it
- **Fix:** Added `tenantId` explicitly to the `data` object (idempotent with extension injection)
- **Files modified:** `backend/src/modules/users/users.service.ts`
- **Commit:** b966562

**3. [Rule 1 - Bug] Extracted getRedisState() helper to fix TypeScript literal narrowing**
- **Found during:** Task 05-02-10 (tsc --noEmit)
- **Issue:** Plan's inline `let redis: RedisState = 'disabled'` caused TS2367 — TypeScript narrowed the type to literal `'disabled'`, making `redis !== 'error'` an impossible comparison
- **Fix:** Extracted `function getRedisState(): RedisState` so TypeScript uses the declared return type rather than narrowing
- **Files modified:** `backend/src/modules/health/health.controller.ts`
- **Commit:** e66d029

**4. [Rule 3 - Blocking] npm install + prisma generate required in worktree**
- **Found during:** Task 05-02-01 (tsc --noEmit)
- **Issue:** Worktree had no `node_modules` — packages declared in package.json but not installed
- **Fix:** Ran `npm install --workspace=backend` (736 packages) + `npx prisma generate` to produce typed client
- **Commits:** Not a code commit — environment setup

## Known Stubs

- `backend/src/modules/health/health.controller.ts:getRedisState()` — always returns `'disabled'`. Phase 8 wires a real Redis client and replaces the stub body with an actual ping.
- `backend/src/common/cron/cron-stubs.service.ts` — Phase 9 (n8n Workflow 1) replaces this service entirely; production guard ensures it never fires in production.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

- [x] `backend/src/common/prisma/prisma.service.ts` exists
- [x] `backend/src/common/prisma/prisma.module.ts` exists
- [x] `backend/src/common/guards/cognito-auth.guard.ts` exists
- [x] `backend/src/common/guards/internal-only.guard.ts` exists
- [x] `backend/src/common/interceptors/audit-log.interceptor.ts` exists
- [x] `backend/src/common/filters/http-exception.filter.ts` exists
- [x] `backend/src/modules/auth/auth.service.ts` exists (no passport imports)
- [x] `backend/src/modules/users/users.service.ts` exists (forTenant() used)
- [x] `backend/src/modules/health/health.controller.ts` exists (@Public())
- [x] `backend/src/common/cron/cron-stubs.service.ts` contains real @Injectable (not export {})
- [x] `APP_GUARD` chain: ThrottlerGuard -> CognitoAuthGuard -> InternalOnlyGuard in AppModule
- [x] `APP_INTERCEPTOR`: AuditLogInterceptor in AppModule
- [x] `APP_FILTER`: HttpExceptionFilter in AppModule
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` produces `dist/main.js`
- [x] No passport/bcrypt imports anywhere in backend/src/
- [x] All 11 task commits present: f4aa32c, 90405af, 1e18f50, a92b8ca, cc85734, e292895, a46fecd, b966562, e66d029, f37aba8, a2b7687
