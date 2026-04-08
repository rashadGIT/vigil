---
phase: 04-prisma-schema
plan: 03
subsystem: database
tags: [prisma, postgresql, schema, indexes, performance, multi-tenancy]

# Dependency graph
requires:
  - phase: 04-02
    provides: schema.prisma with all 17 Phase 1 tables defined and validated

provides:
  - backend/prisma/schema.prisma with all 9 D-11 required @@index declarations verified present
  - T-04-10 mitigated: Case dashboard indexes [tenantId, status] + [tenantId, createdAt(sort: Desc)]
  - T-04-11 mitigated: FollowUp poller index [status, scheduledAt]
  - T-04-12 mitigated: Signature.token @@index([token]) for O(log n) public sign page lookup

affects: [04-04-plan, 04-05-plan, 05-nestjs-backend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All indexes scoped to tenant-first composite: tenantId is always leftmost key for forTenant() filtering"
    - "Sorted index syntax: createdAt(sort: Desc) for descending dashboard and audit queries"
    - "FollowUp polling index is cross-tenant [status, scheduledAt] — n8n grief workflow queries all tenants at once"
    - "Signature.token @@index([token]) is redundant with @unique but explicit per CONTEXT.md D-11 spec"

key-files:
  created: []
  modified:
    - backend/prisma/schema.prisma

key-decisions:
  - "All 9 D-11 indexes were pre-incorporated by plan 04-02 agent — no schema changes required in this plan"
  - "Index list exactly matches D-11 — no extras added, no D-11 indexes missing"

# Metrics
duration: 5min
completed: 2026-04-08
---

# Phase 4 Plan 03: Required Indexes Summary

**All 9 D-11 required @@index declarations verified present on Case, Task, FollowUp, CalendarEvent, AuditLog, Signature — prisma validate passes; no schema changes required (indexes pre-incorporated by plan 04-02)**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-04-08
- **Tasks:** 1 (verification only — no schema changes needed)
- **Files modified:** 0 (schema already complete)

## Accomplishments

All required indexes from D-11 were already present in schema.prisma from plan 04-02. Verified:

- **Case** (3 indexes):
  - `@@index([tenantId, status])` — dashboard list query (T-04-10)
  - `@@index([tenantId, assignedToId])` — assigned-to filter query
  - `@@index([tenantId, createdAt(sort: Desc)])` — recent cases dashboard (T-04-10)
- **Task** (1 index):
  - `@@index([tenantId, completed, dueDate])` — overdue task queries
- **FollowUp** (2 indexes):
  - `@@index([status, scheduledAt])` — n8n grief follow-up poller (T-04-11)
  - `@@index([tenantId, caseId])` — case-scoped follow-up listing
- **CalendarEvent** (1 index):
  - `@@index([tenantId, startTime, endTime])` — calendar range queries
- **AuditLog** (2 indexes):
  - `@@index([tenantId, entityType, entityId])` — entity audit trail queries
  - `@@index([tenantId, userId, createdAt(sort: Desc)])` — user activity audit queries
- **Signature** (1 index):
  - `@@index([token])` — public /sign/[token] route lookup (T-04-12)

`npx prisma validate` passes (verified with DATABASE_URL set).

## Task Commits

This plan required no schema changes — all indexes were pre-incorporated by plan 04-02 agent.

Previous relevant commits:
- `4815fd6` — feat(04-02): Vendor, VendorAssignment, Signature, PriceListItem, CaseLineItem (includes Signature @@index([token]))
- `0fdc119` — feat(04-02): CalendarEvent, CalendarEventStaff, AuditLog (includes CalendarEvent + AuditLog indexes)
- `ad2f2fd` — feat(04-01): core schema with Case, Task, FollowUp indexes

## Files Created/Modified

None — all required indexes were already present.

## Decisions Made

- Plan 04-02 agent incorporated all D-11 indexes inline during model creation rather than deferring to plan 04-03. The final state is identical to what plan 04-03 specifies. No corrective action needed.
- No indexes beyond the D-11 list were added. The constraint "no extras" is satisfied.

## Deviations from Plan

### Pre-completed Work

**1. [Pre-completed by prior agent] All D-11 indexes incorporated during plan 04-02**
- **Found during:** Task 1 verification
- **Issue:** Plan 04-03 expected to add 9 @@index declarations to the schema; all 9 were already present
- **Action:** Verified correctness of existing indexes, ran prisma validate, confirmed exact match to D-11 spec
- **Files modified:** None
- **Net result:** Plan objective fully achieved; no rework needed

## Threat Surface

All three threats from the plan's threat model are mitigated:
- T-04-10 (Case dashboard DoS): `@@index([tenantId, status])` + `@@index([tenantId, createdAt(sort: Desc)])` present
- T-04-11 (n8n FollowUp poller DoS): `@@index([status, scheduledAt])` present
- T-04-12 (public sign page DoS): `@@index([token])` + `token @unique` present

## Threat Flags

No new security surface introduced.

---

*Phase: 04-prisma-schema*
*Completed: 2026-04-08*

## Self-Check: PASSED

- FOUND: backend/prisma/schema.prisma with all 9 D-11 indexes
- `npx prisma validate` passes: VERIFIED
- `@@index([tenantId, status])`: FOUND (1 match)
- `@@index([tenantId, assignedToId])`: FOUND (1 match)
- `@@index([tenantId, createdAt(sort: Desc)])`: FOUND (1 match)
- `@@index([tenantId, completed, dueDate])`: FOUND (1 match)
- `@@index([status, scheduledAt])`: FOUND (1 match)
- `@@index([tenantId, caseId])`: FOUND (3 matches — FollowUp, VendorAssignment, CaseLineItem)
- `@@index([tenantId, startTime, endTime])`: FOUND (1 match)
- `@@index([tenantId, entityType, entityId])`: FOUND (1 match)
- `@@index([tenantId, userId, createdAt(sort: Desc)])`: FOUND (1 match)
- `@@index([token])`: FOUND (1 match)
- No extra indexes beyond D-11 list: VERIFIED
