---
phase: 05-nestjs-backend-scaffold
plan: 01
subsystem: backend
tags: [nestjs, typescript, bootstrap, security, cors, swagger]
dependency_graph:
  requires: [04-prisma-schema]
  provides: [nestjs-app-shell, compilable-backend, dist-main-js]
  affects: [backend/src, backend/package.json, backend/tsconfig.json]
tech_stack:
  added:
    - "@nestjs/common@11.1.18"
    - "@nestjs/core@11.1.18"
    - "@nestjs/config@4.0.3"
    - "@nestjs/swagger@11.2.6"
    - "@nestjs/throttler@6.5.0"
    - "@nestjs/schedule@6.1.1"
    - "@nestjs/platform-express@11.1.18"
    - "@nestjs/axios@4.0.1"
    - "helmet@8.1.0"
    - "class-validator@0.15.1"
    - "class-transformer@0.5.1"
    - "aws-jwt-verify@5.1.1"
    - "@aws-sdk/client-cognito-identity-provider@3.1027.0"
    - "@aws-sdk/client-s3@3.1027.0"
    - "@aws-sdk/client-ses@3.1027.0"
    - "@aws-sdk/client-sns@3.1027.0"
    - "@aws-sdk/s3-request-presigner@3.1027.0"
    - "pdfkit@0.18.0"
    - "resend@6.10.0"
    - "ts-jest@29.4.9"
  patterns:
    - "NestJS app factory with helmet + ValidationPipe + CORS + Swagger-dev-only guard"
    - "ThrottlerModule as DoS mitigation at app level"
    - "ConfigModule.forRoot({ isGlobal: true }) for downstream config injection"
    - "jest.config.ts with @vigil/shared-types path alias via moduleNameMapper"
key_files:
  created:
    - backend/jest.config.ts
    - backend/nest-cli.json
    - backend/.prettierrc
    - backend/eslint.config.mjs
    - backend/src/main.ts
    - backend/src/app.module.ts
  modified:
    - backend/package.json
    - backend/tsconfig.json
    - package-lock.json
decisions:
  - "No passport/bcrypt installed — auth is aws-jwt-verify + Cognito only (D-07 supersedes original dep list)"
  - "Swagger guarded by NODE_ENV !== production — returns 404 in prod (T-05-01 mitigation)"
  - "CORS uses explicit origins array with regex for *.vigilhq.com — no wildcard (T-05-04)"
  - "ValidationPipe whitelist+forbidNonWhitelisted — unknown props rejected globally (T-05-03)"
  - "ThrottlerModule 100 req/min default — per-route tightening deferred to Plan 05-02 (T-05-05)"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-09"
  tasks_completed: 6
  files_changed: 9
---

# Phase 05 Plan 01: App Bootstrap Summary

**One-liner:** NestJS 11 shell with helmet + ValidationPipe + Cognito-ready CORS + Swagger dev-guard installed and compiling with all D-06 deps (no passport).

## What Was Built

Merged NestJS into the existing `backend/` directory without disturbing Phase 4 Prisma artifacts. The scaffold strategy: generated a temp NestJS project to extract `nest-cli.json`, then hand-crafted `main.ts` and `app.module.ts` per design decisions D-06 through D-14.

Key outcomes:
- `npm run build` produces `backend/dist/main.js` (nest build via nest-cli.json)
- `npx tsc --noEmit` passes with strict mode + decorator metadata enabled
- All 736 packages installed; `passport` is absent (confirmed)
- `@vigil/shared-types` resolvable via tsconfig path alias in both tsc and ts-jest
- `backend/src/index.ts` (Phase 2 stub) removed
- `backend/src/common/cron/cron-stubs.service.ts` untouched

## Security Mitigations Applied

All T-05-xx threats from the plan's threat model are mitigated:

| Threat | Mitigation | Location |
|--------|-----------|----------|
| T-05-01 Swagger in prod | `NODE_ENV !== 'production'` guard | main.ts:41 |
| T-05-02 Missing security headers | `helmet()` applied globally | main.ts:15 |
| T-05-03 Unvalidated bodies | `ValidationPipe(whitelist+forbidNonWhitelisted)` | main.ts:19 |
| T-05-04 CORS wildcard cookies | Explicit origins + regex, no wildcard | main.ts:30 |
| T-05-05 Unbounded request rate | `ThrottlerModule` 100 req/60s | app.module.ts:9 |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 05-01-00 | 79ee4d2 | Add jest.config.ts with shared-types mapper |
| 05-01-01 | a43c547 | Scaffold nest-cli.json, prettierrc, eslint; remove Phase 2 index.ts |
| 05-01-02 | 5e19e03 | Install all D-06 deps; remove placeholder scripts |
| 05-01-03 | 255d324 | Update tsconfig with shared-types path alias + decorator settings |
| 05-01-04+05 | 83d6a9d | Add main.ts + app.module.ts; build passes, dist/main.js emitted |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `backend/src/common/cron/cron-stubs.service.ts` — Phase 2 stub intentionally untouched per plan. Plan 05-02 upgrades it with PrismaService injection. Not registered in AppModule yet.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

- [x] `backend/jest.config.ts` exists
- [x] `backend/nest-cli.json` exists
- [x] `backend/src/main.ts` exists
- [x] `backend/src/app.module.ts` exists
- [x] `backend/dist/main.js` produced by `npm run build`
- [x] `backend/src/index.ts` does not exist
- [x] `passport` not in node_modules
- [x] Commits 79ee4d2, a43c547, 5e19e03, 255d324, 83d6a9d all present in git log
