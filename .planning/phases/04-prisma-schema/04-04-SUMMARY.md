---
phase: 04-prisma-schema
plan: 04
subsystem: database
tags: [prisma, schema, stubs, multi-tenancy]
dependency_graph:
  requires: ["04-03"]
  provides: ["04-05"]
  affects: ["backend/prisma/schema.prisma"]
tech_stack:
  added: []
  patterns: ["stub tables with tenantId", "Phase 2/3 forward-compatibility stubs"]
key_files:
  modified:
    - backend/prisma/schema.prisma
decisions:
  - "D-09 enforced on all 7 stubs: every model has tenantId String + tenant Tenant @relation"
  - "D-10 enforced: stubs are minimal — only fields from build plan spec plus tenantId"
  - "Location.tenantId is @unique per build plan Phase 3 multi-location model"
  - "FaithTraditionTemplate has @@unique([tenantId, tradition, serviceType]) composite"
  - "AnalyticsSnapshot has @@index([tenantId, periodStart]) per build plan"
  - "MemorialPage back-relation added to Case model"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-07"
  tasks_completed: 2
  files_modified: 1
---

# Phase 04 Plan 04: Phase 2/3 Stub Tables Summary

7 Phase 2/3 stub models appended to schema.prisma — all with tenantId + Tenant relation, bringing total model count to 24 (17 Phase 1 + 7 stubs).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Append Phase 2 stubs (DecedentTracking, ReferralSource, FamilyPortalAccess, MemorialPage) | 30d0a42 | backend/prisma/schema.prisma |
| 2 | Append Phase 3 stubs (FaithTraditionTemplate, Location, AnalyticsSnapshot) | 30d0a42 | backend/prisma/schema.prisma |

## What Was Built

### Phase 2 Stubs (4 models)

- **DecedentTracking** (`decedent_tracking`) — chain-of-custody status board; `caseId @unique`; `status`, `location`, `updatedBy` fields
- **ReferralSource** (`referral_sources`) — referral source tagging per case; `@@index([tenantId, source])`
- **FamilyPortalAccess** (`family_portal_access`) — family portal access tokens; `accessToken String @unique` (T-04-14 mitigated at DB level)
- **MemorialPage** (`memorial_pages`) — memorial/tribute page per case; `slug @unique`, `photoUrls String[]`, `guestbookEntries Json`; back-relation added to Case model

### Phase 3 Stubs (3 models)

- **Location** (`locations`) — multi-location support; `tenantId @unique` (one Location per Tenant in multi-location model)
- **FaithTraditionTemplate** (`faith_tradition_templates`) — faith tradition task templates; `@@unique([tenantId, tradition, serviceType])`
- **AnalyticsSnapshot** (`analytics_snapshots`) — pre-computed analytics; `@@index([tenantId, periodStart])`

### Tenant Back-Relations Added

`decedentTracking`, `referralSources`, `familyPortalAccess`, `memorialPages`, `locations`, `faithTraditionTemplates`, `analyticsSnapshots`

## Verification

- `prisma validate` passes (with DATABASE_URL set)
- 24 total `^model ` lines in schema.prisma
- All 7 stubs have `tenantId String @map("tenant_id")` + `tenant Tenant @relation`
- All 7 `@@map` table names present

## Deviations from Plan

None — plan executed exactly as written. Both tasks applied in a single commit since all changes are to the same file and both were verified together before committing.

## Threat Surface

T-04-13 mitigated: all 7 stub tables have tenantId enforced at schema level — `forTenant()` extension (Phase 5) will be able to enforce isolation when stubs become live.

T-04-14 mitigated: `FamilyPortalAccess.accessToken` is `@unique` at DB level.

T-04-15 accepted: `MemorialPage.slug` is intentionally public; `@unique` enforced.

## Known Stubs

All 7 models in this plan are intentional stubs — schema-only with no service code. They exist to avoid disruptive schema migrations when Phase 2/3 features are built. Each will be wired with service code in their respective future phases.

## Self-Check: PASSED

- `backend/prisma/schema.prisma` — FOUND, modified
- Commit 30d0a42 — FOUND
- Model count 24 — VERIFIED
- All 7 `@@map` annotations — VERIFIED
- `prisma validate` — PASSED
