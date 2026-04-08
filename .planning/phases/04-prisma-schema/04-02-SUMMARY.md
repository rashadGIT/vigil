---
phase: 04-prisma-schema
plan: 02
subsystem: database
tags: [prisma, postgresql, schema, multi-tenancy, soft-delete, audit-log, e-signatures, vendor, calendar]

# Dependency graph
requires:
  - phase: 04-01
    provides: schema.prisma with 9 core models (Tenant through FollowUp) + 10 enums
  - phase: 03-shared-types-package
    provides: IVendor, ISignature, IPriceListItem, ICaseLineItem, ICalendarEvent, IAuditLog interfaces

provides:
  - backend/prisma/schema.prisma extended with 8 supporting models + 1 join table
  - All 17 Phase 1 tables now defined and validated
  - T-04-06 mitigated: Signature.token String @unique (unguessable token for /sign/[token] route)
  - T-04-07 mitigated: AuditLog append-only by schema (no updatedAt, no deletedAt, no archivedAt)
  - T-04-08 mitigated: VendorAssignment + CalendarEventStaff both carry tenantId for forTenant() filtering
  - T-04-09 mitigated: Vendor has archivedAt despite IVendor omission (D-03 + 7-year retention path)

affects: [04-03-plan, 04-04-plan, 04-05-plan, 05-nestjs-backend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vendor soft-delete: both deletedAt + archivedAt per D-03 (IVendor interface omits archivedAt; build plan wins)"
    - "AuditLog append-only: no updatedAt/deletedAt/archivedAt — compliance repudiation defense"
    - "CalendarEventStaff as separate join model (not array) per CAL-03"
    - "Signature.token String @unique + @@index([token]) for public /sign/[token] route"
    - "All join tables (VendorAssignment, CalendarEventStaff) carry tenantId for forTenant() isolation"

key-files:
  created: []
  modified:
    - backend/prisma/schema.prisma

key-decisions:
  - "Vendor gets archivedAt despite IVendor interface omission — D-03 + build plan spec wins (7-year retention path needed)"
  - "AuditLog is append-only by schema design: no updatedAt, no deletedAt, no archivedAt — repudiation defense T-04-07"
  - "CalendarEventStaff is a separate model, not an array on CalendarEvent — per CAL-03 + D-04 Claude discretion"
  - "Signature.token has both @unique and @@index([token]) — redundant but spec-explicit per CONTEXT.md specifics"
  - "VendorAssignment and CalendarEventStaff both carry tenantId — required for forTenant() isolation (T-04-08)"

# Metrics
duration: 10min
completed: 2026-04-08
---

# Phase 4 Plan 02: Supporting Schema Models Summary

**8 supporting Prisma models appended (Vendor with dual soft-delete, VendorAssignment join, Signature with unique token, PriceListItem, CaseLineItem, CalendarEvent, CalendarEventStaff join, AuditLog append-only) completing all 17 Phase 1 tables with prisma validate passing**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-04-08
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- **Vendor**: name, type (VendorType), contactName?, email?, phone?, active, deletedAt?, archivedAt? (D-03), createdAt, updatedAt
- **VendorAssignment**: join table with tenantId + caseId + vendorId + role? + status — no Phase 3 interface, shape from build plan VEND-02
- **Signature**: token String @unique (T-04-06 mitigation), signerName, signerEmail?, signerIp?, signedAt?, signatureData?, expiresAt, @@index([token])
- **PriceListItem**: PriceCategory enum, Decimal(10,2) price, taxable, active, sortOrder
- **CaseLineItem**: quantity, Decimal(10,2) unitPrice + total, FK to PriceListItem
- **CalendarEvent**: optional caseId, EventType enum, startTime, endTime, @@index([tenantId, startTime, endTime])
- **CalendarEventStaff**: join model per CAL-03 — calendarEventId + userId + tenantId, @@unique([calendarEventId, userId])
- **AuditLog**: append-only (no updatedAt, no deletedAt, no archivedAt), @@index([tenantId, entityType, entityId]) + @@index([tenantId, userId, createdAt(Desc)])
- All Tenant/Case/User back-relations updated incrementally
- `npx prisma validate` passes with all 17 models and relations resolved

## Task Commits

Each task was committed atomically:

1. **Task 1: Vendor, VendorAssignment, Signature, PriceListItem, CaseLineItem** - `4815fd6` (feat)
2. **Task 2: CalendarEvent, CalendarEventStaff, AuditLog** - `0fdc119` (feat)

## Files Created/Modified

- `backend/prisma/schema.prisma` — Extended from 9 core models to 17 Phase 1 models; Tenant/Case/User back-relations updated

## Decisions Made

- Vendor gets `archivedAt` despite `IVendor` interface omitting it — D-03 specifies build plan spec wins; n8n Workflow 5 data retention cleanup needs this field on all soft-deletable entities
- AuditLog has no `updatedAt`, no `deletedAt`, no `archivedAt` — append-only by schema design enforces repudiation defense (T-04-07). Acceptance criterion verified 0 audit-related updatedAt lines
- CalendarEventStaff is a separate model (not an array on CalendarEvent) — matches build plan explicit join table requirement; enables direct userId-indexed queries
- Signature.token has both `@unique` field constraint and `@@index([token])` — CONTEXT.md specifics section explicitly calls both out; redundant but spec-compliant

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

No new security surface introduced beyond what is already in the plan's threat model (T-04-06 through T-04-09 all addressed).

---

*Phase: 04-prisma-schema*
*Completed: 2026-04-08*

## Self-Check: PASSED

- FOUND: backend/prisma/schema.prisma (17 models)
- FOUND: commit 4815fd6 (Task 1)
- FOUND: commit 0fdc119 (Task 2)
- `npx prisma validate` passes
- AuditLog has no updatedAt/deletedAt/archivedAt: VERIFIED
- Vendor has both deletedAt + archivedAt: VERIFIED
- Signature.token is @unique: VERIFIED
- CalendarEventStaff exists as separate model: VERIFIED
- All 17 Phase 1 tables defined: VERIFIED
