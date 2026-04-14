---
phase: 11-seed-data-demo-environment
plan: "03"
subsystem: backend/seed
tags: [seed, cases, tasks, demo-data]
dependency_graph:
  requires: [11-01, 11-02]
  provides: [3-sunrise-demo-cases, 45-seeded-tasks, primary-family-contacts]
  affects: [dashboard-case-list, overdue-badge, task-completion-view]
tech_stack:
  added: []
  patterns: [idempotent-seed-findFirst, template-array-export]
key_files:
  created: []
  modified:
    - backend/prisma/seed.ts
    - backend/src/modules/tasks/task-templates.service.ts
decisions:
  - "Export BURIAL/CREMATION/GRAVESIDE/MEMORIAL arrays from task-templates.service.ts so seed.ts can import without instantiating NestJS DI"
  - "Idempotency via findFirst on (tenantId, deceasedName) for cases, (tenantId, caseId, isPrimaryContact=true) for contacts, (tenantId, caseId, title) for tasks"
  - "Margaret Chen overdue task forced by setting dueDate = now - 1 day on index 4 — surfaces overdue badge on dashboard"
metrics:
  duration: "15m"
  completed_date: "2026-04-14"
  tasks_completed: 2
  files_modified: 2
---

# Phase 11 Plan 03: Demo Cases Seed Summary

3 Sunrise demo cases seeded with task checklists generated from exported service-type template arrays; Margaret Chen's in-progress case has a forced overdue task that surfaces the dashboard overdue badge — key demo moment.

## What Was Built

`seedCases(sunriseId, assignedToId)` added to `backend/prisma/seed.ts`. Creates 3 Sunrise cases with distinct statuses, a primary FamilyContact per case, and full task checklists from the service-type templates.

| Case | Service | Status | Tasks | Completed | Overdue |
|------|---------|--------|-------|-----------|---------|
| James Holloway | burial | new | 18 | 0 | 0 |
| Margaret Chen | cremation | in_progress | 15 | 3 | 1 |
| Robert Abrams | graveside | completed | 12 | 12 | 0 |

Heritage tenant has 0 cases (D-08 isolation preserved).

## Task Template Export

Added `export` to all 4 const arrays in `task-templates.service.ts` (`BURIAL`, `CREMATION`, `GRAVESIDE`, `MEMORIAL`). No structural change — `TaskTemplatesService` still consumes them via the `TEMPLATES` record.

## Idempotency

- Case: `findFirst` by `(tenantId, deceasedName)` — updates status/assignee on re-run
- FamilyContact: `findFirst` by `(tenantId, caseId, isPrimaryContact=true)` — skips if exists
- Task: `findFirst` by `(tenantId, caseId, title)` — updates dueDate/completed on re-run

Re-running `prisma db seed` is a no-op after first run.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — all seed data uses hardcoded constants; `tenantId` is explicit on every create call. No user input crosses the boundary. T-11-07 mitigated: every `create` passes `sunriseId` directly.

## Self-Check: PASSED

- FOUND: backend/prisma/seed.ts
- FOUND: backend/src/modules/tasks/task-templates.service.ts
- FOUND commit: 5d42502 (export template arrays)
- FOUND commit: 94eeb6e (seedCases implementation)
