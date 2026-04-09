---
phase: 05-nestjs-backend-scaffold
plan: 03
subsystem: backend
tags: [nestjs, cases, contacts, tasks, intake, multi-tenancy, transactions]
dependency_graph:
  requires: [05-02, 04-prisma-schema]
  provides: [cases-module, contacts-module, tasks-module, intake-module, task-templates-engine]
  affects:
    - backend/src/modules/cases/
    - backend/src/modules/contacts/
    - backend/src/modules/tasks/
    - backend/src/modules/intake/
    - backend/src/app.module.ts
tech_stack:
  added: []
  patterns:
    - "CasesService.assertValidTransition() — ALLOWED_TRANSITIONS map enforces new→in_progress→completed→archived"
    - "Two-stage soft delete: deletedAt (90-day recoverable) → archivedAt (Phase 9 n8n retention)"
    - "TaskTemplatesService.buildTasksForCase() — typed task list per ServiceType, ready for createMany()"
    - "IntakeService.$transaction — atomic case + familyContact + task.createMany + calendarEvent"
    - "Bare prisma.tenant.findUnique for slug lookup (Tenant model has no tenantId column)"
    - "Explicit tenantId in create() data alongside forTenant() — Prisma type system requires it at compile time"
key_files:
  created:
    - backend/src/modules/cases/dto/create-case.dto.ts
    - backend/src/modules/cases/dto/update-case.dto.ts
    - backend/src/modules/cases/dto/case-filter.dto.ts
    - backend/src/modules/cases/cases.service.ts
    - backend/src/modules/cases/cases.controller.ts
    - backend/src/modules/cases/cases.module.ts
    - backend/src/modules/contacts/dto/create-contact.dto.ts
    - backend/src/modules/contacts/dto/update-contact.dto.ts
    - backend/src/modules/contacts/contacts.service.ts
    - backend/src/modules/contacts/contacts.controller.ts
    - backend/src/modules/contacts/contacts.module.ts
    - backend/src/modules/tasks/dto/create-task.dto.ts
    - backend/src/modules/tasks/dto/update-task.dto.ts
    - backend/src/modules/tasks/task-templates.service.ts
    - backend/src/modules/tasks/tasks.service.ts
    - backend/src/modules/tasks/tasks.controller.ts
    - backend/src/modules/tasks/tasks.module.ts
    - backend/src/modules/intake/dto/intake-form.dto.ts
    - backend/src/modules/intake/intake.service.ts
    - backend/src/modules/intake/intake.controller.ts
    - backend/src/modules/intake/intake.module.ts
  modified:
    - backend/src/app.module.ts
decisions:
  - "Explicit tenantId in all create() calls alongside forTenant() — Prisma type system requires tenantId in data at compile time even though runtime extension injects it"
  - "TasksController uses @Controller() with full path prefixes (cases/:caseId/tasks) — avoids nested module routing complexity"
  - "IntakeService uses bare prisma.tenant.findUnique (not forTenant) — Tenant model has no tenantId column; UNSCOPED_MODELS pattern from PrismaService"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-09"
  tasks_completed: 8
  files_changed: 22
---

# Phase 05 Plan 03: Day 10 MVP Modules Summary

**One-liner:** Four Day 10 MVP modules (cases + contacts + tasks + intake) with atomic intake transaction, typed task templates, and enforced status transitions — all compiling and registered in AppModule.

## What Was Built

The four modules that make the product demo-able in 15 minutes. All are tenant-scoped via `forTenant(tenantId)` on every non-Tenant query.

**CasesModule** (`/cases`):
- Full CRUD: `POST /cases`, `GET /cases`, `GET /cases/:id`, `PATCH /cases/:id`, `PATCH /cases/:id/status`, `DELETE /cases/:id`
- `ALLOWED_TRANSITIONS` map enforces valid status transitions: `new → in_progress → completed → archived` (no backward jumps, no skipping)
- `findAll()` returns `overdueTaskCount` per case (tasks where `completed=false AND dueDate < now`)
- Two-stage soft delete: `softDelete()` sets `deletedAt`; Phase 9 n8n workflow 5 sets `archivedAt` at +90d and hard-deletes after 7 years

**ContactsModule** (`/cases/:caseId/contacts`):
- Nested under cases; `isPrimaryContact` ordered first in `findByCase()`
- Full CRUD: create, list, update, delete

**TasksModule** (`/cases/:caseId/tasks`, `/tasks/overdue`, `/tasks/:id`):
- `TaskTemplatesService.buildTasksForCase()` — typed task arrays by `ServiceType`: BURIAL=18, CREMATION=15, GRAVESIDE=12, MEMORIAL=10 items
- `update()` auto-sets `completedBy` to the requesting `user.sub` when `completed=true`
- `findOverdue()` cross-case query for staff dashboard

**IntakeModule** (`POST /intake/:slug`):
- `@Public()` — no auth required (public embeddable form)
- `@Throttle({ default: { limit: 30, ttl: 60_000 } })` — DoS mitigation
- `IntakeFormDto` uses `@ValidateNested()` + `@Type(() => IntakeContactDto)` for nested contact validation
- Slug → Tenant lookup via bare `this.prisma.tenant.findUnique` (Tenant model has no tenantId)
- Single `$transaction`: case + familyContact + `task.createMany` (template tasks) + calendarEvent placeholder
- Logs intake event; n8n webhook call deferred to Plan 05-05 (N8nService not yet wired)

`npx tsc --noEmit` and `npm run build` both pass. `dist/main.js` rebuilt.

## Security Mitigations Applied

| Threat | Mitigation | Location |
|--------|-----------|----------|
| T-05-09 Cross-tenant case access | `forTenant(user.tenantId)` on every query; tenantId from JWT not request body | cases.service.ts |
| T-05-10 Invalid status transition | `ALLOWED_TRANSITIONS` map + `assertValidTransition()` | cases.service.ts |
| T-05-12 Intake DoS | `@Throttle({ limit: 30, ttl: 60_000 })` | intake.controller.ts |
| T-05-13 Partial intake state on failure | Entire intake flow in `prisma.$transaction` | intake.service.ts |
| T-05-14 Unvalidated intake payload | `IntakeFormDto` + `ValidationPipe` (global) | intake/dto/intake-form.dto.ts |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 05-03-01 | 7bb75bd | Cases DTOs (create, update, filter) |
| 05-03-02 | 4760f54 | cases.service.ts (CRUD + soft delete + status transitions) |
| 05-03-03 | d494455 | cases.controller.ts + cases.module.ts |
| 05-03-04 | c72ce79 | Contacts module (service + controller + DTOs) |
| 05-03-05 | 74cbad3 | task-templates.service.ts (18+15+12+10 items) |
| 05-03-06 | 42a80eb | Tasks module (service + controller + DTOs) |
| 05-03-07 | 6736cca | Intake module (atomic transaction) |
| 05-03-08 | 2d15f01 | Wire all four modules into AppModule |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added explicit tenantId to ContactsService.create() data**
- **Found during:** Task 05-03-04 (tsc --noEmit)
- **Issue:** `forTenant().familyContact.create({ data: { ...dto, caseId } })` caused TS2322 — Prisma type system requires `tenantId` in data at compile time even though the runtime extension injects it. Same root cause as the UsersService fix in Plan 05-02.
- **Fix:** Added `tenantId` explicitly to the data spread (idempotent with extension injection)
- **Files modified:** `backend/src/modules/contacts/contacts.service.ts`
- **Commit:** c72ce79

**2. [Rule 1 - Bug] Added explicit tenantId to TasksService.create() data**
- **Found during:** Task 05-03-06 (tsc --noEmit)
- **Issue:** Same TS2322 pattern — `task.create({ data: { caseId, title, dueDate } })` missing required `tenantId`
- **Fix:** Added `tenantId` to data object
- **Files modified:** `backend/src/modules/tasks/tasks.service.ts`
- **Commit:** 42a80eb

**3. [Rule 3 - Blocking] npm install + prisma generate required in worktree**
- **Found during:** Task 05-03-01 (tsc --noEmit) — no node_modules in this worktree
- **Fix:** Ran `npm install --workspace=backend` + `npx prisma generate`
- **Commits:** Not a code commit — environment setup (same pattern as Plan 05-02)

## Known Stubs

- `backend/src/modules/intake/intake.service.ts` — n8n webhook call (step 5) is a `logger.log()` placeholder. Plan 05-05 wires `N8nService` as an injected dependency and replaces the log with a real HTTP webhook call.
- `backend/src/modules/intake/intake.service.ts:calendarEvent` — `startTime=now, endTime=now+1h` is a placeholder. The actual service date/time is confirmed with the family post-intake; the calendar entry exists so the case is visible in scheduling but requires manual update.

## Threat Flags

None — no new network endpoints or auth paths beyond the plan's threat model.

## Self-Check: PASSED

- [x] `backend/src/modules/cases/cases.service.ts` exists (forTenant on every query)
- [x] `backend/src/modules/contacts/contacts.service.ts` exists
- [x] `backend/src/modules/tasks/task-templates.service.ts` exists (BURIAL=18, CREMATION=15, GRAVESIDE=12, MEMORIAL=10)
- [x] `backend/src/modules/intake/intake.service.ts` exists (bare prisma.tenant for slug lookup)
- [x] `backend/src/modules/intake/intake.controller.ts` has @Public()
- [x] `intake.service.ts` wraps case + contact + tasks + calendar in single $transaction
- [x] `ALLOWED_TRANSITIONS` enforces new→in_progress→completed→archived (no backward jumps)
- [x] `cases.service.ts` uses forTenant(tenantId) on every query (8 occurrences confirmed)
- [x] `npx tsc --noEmit` passes (exit 0)
- [x] `npm run build` succeeds, dist/main.js rebuilt
- [x] All 8 task commits present: 7bb75bd, 4760f54, d494455, c72ce79, 74cbad3, 42a80eb, 6736cca, 2d15f01
