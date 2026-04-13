---
phase: 09-n8n-automation-workflows
plan: "01"
subsystem: backend-internal-api
tags: [n8n, internal-endpoints, prisma, cascade-deletes, pdf-generation, data-retention]
dependency_graph:
  requires: [05-nestjs-backend-scaffold, 04-prisma-schema]
  provides: [n8n-callback-endpoints, cascade-delete-safety, overdue-task-reporting]
  affects: [follow-ups-module, cases-module, documents-module]
tech_stack:
  added: []
  patterns: [InternalOnly-guard, cross-tenant-operation, forTenant-scoping]
key_files:
  created:
    - backend/src/modules/documents/internal-documents.controller.ts
    - backend/src/modules/cases/internal-cases.controller.ts
    - backend/src/modules/follow-ups/internal-follow-ups.controller.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/.env.example
    - backend/src/modules/documents/documents.module.ts
    - backend/src/modules/cases/cases.service.ts
    - backend/src/modules/cases/cases.module.ts
    - backend/src/modules/follow-ups/follow-ups.service.ts
    - backend/src/modules/follow-ups/follow-ups.module.ts
decisions:
  - "Cross-tenant queries in hardDeleteExpiredCases() and getOverdueTaskSummary() bypass forTenant() by design — these are global retention/monitoring operations protected by InternalOnlyGuard"
  - "FollowUp.contact cascade added alongside FollowUp.case to prevent FK constraint errors when FamilyContact is deleted"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 7
---

# Phase 09 Plan 01: n8n Internal Endpoints Summary

**One-liner:** Four @InternalOnly() backend endpoints enabling n8n workflows to generate PDFs, hard-delete expired cases, mark follow-ups sent, and report overdue tasks — with cascade deletes on all Case child relations for FK-safe hard deletion.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add cascade deletes to Prisma schema + env var | 6ba8ed1 | schema.prisma, .env.example |
| 2 | Create all 4 internal endpoint controllers + service methods | d3b5cb9 | 3 new controllers, 5 updated files |

## What Was Built

### Prisma Schema — Cascade Deletes (Task 1)
Added `onDelete: Cascade` to all 11 Case child relations: FamilyContact, Task, Obituary, Document, Payment, FollowUp, VendorAssignment, Signature, CaseLineItem, CalendarEvent, MemorialPage. Also added cascade on FollowUp → FamilyContact to prevent FK errors when FamilyContact cascades from Case.

### .env.example (Task 1)
Added missing `N8N_WEBHOOK_REVIEW_REQUEST` variable for n8n Workflow 6 (Review Request).

### Internal Endpoints (Task 2)

| Endpoint | Controller | Purpose |
|----------|-----------|---------|
| `POST /internal/documents/generate-service-program/:caseId` | InternalDocumentsController | Generates PDF via PdfService, uploads to S3, creates Document record |
| `GET /internal/cases/pending-hard-delete` | InternalCasesController | Cross-tenant hard delete of cases archived 7+ years ago |
| `GET /internal/cases/overdue-tasks` | InternalCasesController | Cross-tenant overdue task count grouped by tenant |
| `PATCH /internal/cases/:caseId/followup-complete` | InternalFollowUpsController | Marks all pending follow-ups for a case as sent |

All endpoints use `@UseGuards(InternalOnlyGuard)` + `@InternalOnly()` decorator — rejects any request without valid `x-vigil-internal-key` header.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all endpoints are fully wired with real service logic.

## Threat Surface Scan

All new endpoints are protected by `InternalOnlyGuard` which validates `x-vigil-internal-key` against `INTERNAL_API_KEY` env var. The cross-tenant operations (`hardDeleteExpiredCases`, `getOverdueTaskSummary`) bypass `forTenant()` intentionally and are documented with comments. No new unguarded surface introduced.

## Self-Check: PASSED

- `/Users/rashad/StudioProjects/Vigil/backend/src/modules/documents/internal-documents.controller.ts` — EXISTS
- `/Users/rashad/StudioProjects/Vigil/backend/src/modules/cases/internal-cases.controller.ts` — EXISTS
- `/Users/rashad/StudioProjects/Vigil/backend/src/modules/follow-ups/internal-follow-ups.controller.ts` — EXISTS
- Commit 6ba8ed1 — EXISTS
- Commit d3b5cb9 — EXISTS
- TypeScript: `npx tsc --noEmit` — PASSED (0 errors)
- Prisma validate — PASSED
- Cascade count: 12 entries in schema.prisma
- N8N_WEBHOOK_REVIEW_REQUEST in .env.example — PRESENT
