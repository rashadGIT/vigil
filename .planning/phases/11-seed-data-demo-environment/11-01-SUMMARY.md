---
phase: 11-seed-data-demo-environment
plan: "01"
subsystem: backend/seed
tags: [seed, prisma, tenants, users, idempotent]
dependency_graph:
  requires: []
  provides: [backend/prisma/seed.ts, prisma.seed config]
  affects: [backend/package.json]
tech_stack:
  added: []
  patterns: [prisma upsert idempotency, deterministic cognitoSub stubs, optional Cognito gate]
key_files:
  created:
    - backend/prisma/seed.ts
  modified:
    - backend/package.json
decisions:
  - "Use raw PrismaClient (not forTenant()) in seed.ts — seed is a dev script, not NestJS context"
  - "Cognito user creation gated on AWS_REGION + COGNITO_USER_POOL_ID env vars — offline-safe"
  - "Deterministic stub cognitoSub format: cognito-sub-<email-with-dashes> — cannot collide with real UUID subs"
metrics:
  duration: "12 minutes"
  completed_date: "2026-04-14"
  tasks_completed: 2
  files_changed: 2
---

# Phase 11 Plan 01: Seed Scaffold — Tenants and Users Summary

Idempotent prisma seed scaffold shipping 2 tenants (Sunrise standard / Heritage pilot) and 4 users with deterministic stub cognitoSub values when offline; optional Cognito AdminCreateUser when env vars are present.

## What Was Built

- `backend/prisma/seed.ts` — entry-point seed script using raw `PrismaClient`; `seedTenants()` creates Sunrise Funeral Home and Heritage Memorial via `upsert` keyed on `slug`; `seedUsers()` creates 4 users (director + staff per tenant) via `upsert` keyed on `email`.
- `backend/package.json` — added `"prisma": { "seed": "ts-node prisma/seed.ts" }` top-level key so `npx prisma db seed` works.

## Verification Results

- First run: `tenants: 2, users: 4` — success.
- Second run (idempotent): identical output, no errors, no duplicates.
- `director@sunrise.demo` role=admin, tenant=sunrise — DEV_AUTH_BYPASS login ready.
- Offline (no AWS env vars): stub cognitoSub values used, no error.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — tenant and user records are fully wired with real field values. Subsequent plans (11-02 through 11-04) will extend `main()` with cases, price list, vendors, and follow-ups.

## Threat Flags

None — no new network endpoints or auth paths introduced. Seed script is local-dev-only by policy (targets DATABASE_URL; prod DB must not set this locally).

## Self-Check: PASSED

- `backend/prisma/seed.ts` — FOUND
- `backend/package.json` prisma.seed key — FOUND
- Commit `623278d` — FOUND
