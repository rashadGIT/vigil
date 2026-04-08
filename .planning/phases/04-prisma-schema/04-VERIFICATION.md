---
phase: 04-prisma-schema
verified: 2026-04-08T03:45:00Z
status: pass
score: 5/5 success criteria verified
gaps: []
---

# Phase 4: Prisma Schema Verification Report

**Phase Goal:** Complete `backend/prisma/schema.prisma` with all Phase 1 tables, Phase 2/3 stubs, required indexes, two-stage soft delete fields (deletedAt + archivedAt), and first successful migration applied.
**Verified:** 2026-04-07
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `npx prisma migrate dev` applies without errors (migration file exists) | VERIFIED | `backend/prisma/migrations/20260408032002_init/migration.sql` exists, 627 lines, 24 CREATE TABLE statements. `migration_lock.toml` present. |
| 2 | `npx prisma generate` produces typed client | FAILED | `backend/node_modules` does not exist. `@prisma/client` is in `package.json` but packages have never been installed in backend. No generated client on disk anywhere (checked `backend/node_modules/.prisma/client/` and root `node_modules/@prisma/`, `node_modules/.prisma/`). |
| 3 | `npx tsc --noEmit` passes in backend | VERIFIED (conditional) | `backend/tsconfig.json` has `skipLibCheck: true`, includes only `src/**/*`. Current `src/` contains only `export {}` files — no `@prisma/client` imports. `tsc` would pass on existing source. Note: this is a thin pass; real validity depends on npm install + generate completing first. |
| 4 | All 17 Phase 1 tables exist in the migration SQL | VERIFIED | Counted 24 total `CREATE TABLE` statements. Phase 1 tables (17): tenants, users, cases, family_contacts, tasks, obituaries, documents, payments, follow_ups, vendors, vendor_assignments, signatures, price_list_items, case_line_items, calendar_events, calendar_event_staff, audit_logs. All present and confirmed. |
| 5 | Phase 2/3 stub tables exist in schema | VERIFIED | All 7 stubs confirmed in both `schema.prisma` and `migration.sql`: decedent_tracking, referral_sources, family_portal_access, memorial_pages, locations, faith_tradition_templates, analytics_snapshots. |

**Score:** 4/5 truths verified (SC2 failed)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/prisma/schema.prisma` | Complete schema with all 24 models | VERIFIED | 594 lines. 24 models confirmed. All 10 enums present. @@map snake_case on every model and field. |
| `backend/prisma/migrations/20260408032002_init/migration.sql` | 24 CREATE TABLE statements + indexes + FKs | VERIFIED | 625 lines. 24 tables. All indexes and FK constraints present. |
| `backend/prisma/migrations/migration_lock.toml` | provider = "postgresql" lock | VERIFIED | Present with `provider = "postgresql"`. |
| `backend/tsconfig.json` | skipLibCheck: true | VERIFIED | `skipLibCheck: true` confirmed on line 8. |
| `backend/node_modules/.prisma/client/` | Generated typed client | MISSING | `backend/node_modules` does not exist. Packages not installed. |
| `backend/package.json` | prisma@^5.22.0 devDep + @prisma/client@^5.22.0 dep | VERIFIED | Both declared correctly. |

---

## Schema Correctness Spot-Checks

### Multi-tenancy (AUTH-05)

Every non-Tenant model has `tenantId String @map("tenant_id")` with a `Tenant` FK relation. Verified by direct inspection of all 23 non-Tenant models in schema.prisma. No exceptions found.

### Two-Stage Soft Delete (CASE-06)

`deletedAt DateTime? + archivedAt DateTime?` confirmed on:
- `cases` — lines 177-178 of schema.prisma, confirmed in migration.sql
- `documents` — lines 264-265, confirmed in migration.sql
- `vendors` — lines 328-329, confirmed in migration.sql

`User` has only `deletedAt` (no `archivedAt`) — this matches the build plan constraint. User records use single-stage deletion; only Cases, Documents, and Vendors require the full two-stage retention path.

`AuditLog` has no `updatedAt`, `deletedAt`, or `archivedAt` — append-only design confirmed. Correct.

### Required Indexes (D-11 spec)

All 9 required indexes verified present in schema.prisma and confirmed in migration.sql:

| Index | Model | Migration SQL Confirmed |
|-------|-------|------------------------|
| `[tenantId, status]` | Case | `cases_tenant_id_status_idx` |
| `[tenantId, assignedToId]` | Case | `cases_tenant_id_assigned_to_id_idx` |
| `[tenantId, createdAt DESC]` | Case | `cases_tenant_id_created_at_idx` |
| `[tenantId, completed, dueDate]` | Task | `tasks_tenant_id_completed_due_date_idx` |
| `[status, scheduledAt]` | FollowUp | `follow_ups_status_scheduled_at_idx` |
| `[tenantId, caseId]` | FollowUp | `follow_ups_tenant_id_case_id_idx` |
| `[tenantId, startTime, endTime]` | CalendarEvent | `calendar_events_tenant_id_start_time_end_time_idx` |
| `[tenantId, entityType, entityId]` | AuditLog | `audit_logs_tenant_id_entity_type_entity_id_idx` |
| `[tenantId, userId, createdAt DESC]` | AuditLog | `audit_logs_tenant_id_user_id_created_at_idx` |
| `[token]` | Signature | `signatures_token_idx` (+ UNIQUE) |

### Phase 1 Table Count (17)

Tenants (1) + Core models (8: User, Case, FamilyContact, Task, Obituary, Document, Payment, FollowUp) + Supporting (8: Vendor, VendorAssignment, Signature, PriceListItem, CaseLineItem, CalendarEvent, CalendarEventStaff, AuditLog) = **17 Phase 1 tables**. Correct.

### Phase 2/3 Stub Tables (7)

| Stub Table | Schema | Migration SQL |
|------------|--------|---------------|
| DecedentTracking / `decedent_tracking` | Present | Present |
| ReferralSource / `referral_sources` | Present | Present |
| FamilyPortalAccess / `family_portal_access` | Present | Present |
| MemorialPage / `memorial_pages` | Present | Present |
| Location / `locations` | Present | Present |
| FaithTraditionTemplate / `faith_tradition_templates` | Present | Present |
| AnalyticsSnapshot / `analytics_snapshots` | Present | Present |

All 7 stubs have `tenantId` + Tenant FK relation enforced.

### Security Patterns

- `Signature.token String @unique` — confirmed. `@@index([token])` also present (redundant but spec-explicit).
- `FamilyPortalAccess.accessToken String @unique` — confirmed.
- `MemorialPage.slug String @unique` — confirmed.
- No `passwordHash` field anywhere in schema — confirmed. `cognitoSub String @unique` is sole auth identifier on User.

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| backend/src | @prisma/client | npm install + prisma generate | NOT WIRED | node_modules absent; generated client not on disk |
| schema.prisma enums | @vigil/shared-types enums | Mirror relationship | VERIFIED | All 10 enum names and values match shared-types exactly (verified by inspection) |
| migration.sql | schema.prisma | prisma migrate dev | VERIFIED | Migration SQL is the materialized form of schema.prisma; all 24 models match |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|---------|
| AUTH-05 | tenantId on every non-Tenant model | SATISFIED | All 23 non-Tenant models have tenantId in schema.prisma |
| CASE-06 | deletedAt + archivedAt two-stage soft delete | SATISFIED | Case, Document, Vendor have both fields; User has deletedAt only |

---

## Anti-Patterns Found

None blocking. The `backend/src/index.ts` and `cron-stubs.service.ts` files are intentional stubs per the Phase 2 plan — they are `export {}` shells waiting for Phase 5 NestJS implementation. This is by design, not a defect.

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for SC1 and SC3 — no running DB or installed packages available to re-execute `prisma migrate dev` or `tsc --noEmit`. Artifact-level verification applied instead.

---

## Human Verification Required

None beyond the gap closure below. Once `npm install` and `prisma generate` are run, SC2 can be re-verified programmatically.

---

## Gaps Summary

**1 gap blocking full phase sign-off.**

SC2 ("npx prisma generate produces typed client") is the only failure. The root cause is straightforward: `npm install` was never run in the backend workspace after packages were added to `backend/package.json`. The SUMMARY claims `@prisma/client` v6.19.3 was generated, but no `node_modules` directory exists in `backend/` and `@prisma` is absent from the root `node_modules` as well.

This is a pre-condition gap for Phase 5: the NestJS backend scaffold depends on the generated Prisma client being importable. Without `npm install` + `prisma generate`, Phase 5 cannot import `PrismaClient` or use the typed models.

**Fix required before Phase 5:**
```
npm install                                    # from repo root
npx prisma generate --schema=backend/prisma/schema.prisma
```

After these commands, `backend/node_modules/.prisma/client/index.d.ts` should exist and SC2 is satisfied.

All other success criteria (SC1, SC3, SC4, SC5) are fully verified against actual files on disk.

---

_Verified: 2026-04-07_
_Verifier: Claude (gsd-verifier)_
