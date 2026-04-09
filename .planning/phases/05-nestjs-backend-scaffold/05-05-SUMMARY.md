---
phase: 05-nestjs-backend-scaffold
plan: 05
subsystem: backend
tags: [nestjs, vendors, calendar, follow-ups, n8n, email, stubs, phase2, phase3, typescript]
dependency_graph:
  requires: [05-04, 04-prisma-schema]
  provides: [vendors-module, calendar-module, follow-ups-module, n8n-module, email-module, phase2-3-stubs, complete-appmodule]
  affects:
    - packages/shared-types/src/interfaces/vendor.interface.ts
    - backend/src/modules/vendors/
    - backend/src/modules/calendar/
    - backend/src/modules/follow-ups/
    - backend/src/modules/n8n/
    - backend/src/common/email/
    - backend/src/modules/tracking/
    - backend/src/modules/referrals/
    - backend/src/modules/family-portal/
    - backend/src/modules/memorial/
    - backend/src/modules/analytics/
    - backend/src/modules/multi-location/
    - backend/src/modules/ai-obituary/
    - backend/src/modules/chatbot/
    - backend/src/modules/multi-faith/
    - backend/src/app.module.ts
tech_stack:
  added:
    - "N8nModule (@Global) — HttpService-backed webhook bridge with explicit EVENT_TO_ENV_VAR mapping"
    - "EmailModule (@Global) — Resend (dev) / SES (prod) unified interface via EMAIL_PROVIDER env var"
  patterns:
    - "Explicit event→env var mapping object in N8nService (not naive string interpolation)"
    - "onModuleInit [PLACEHOLDER] warnings for unconfigured n8n webhooks"
    - "Double-booking prevention: CalendarService.assertNoDoubleBooking checks CalendarEventStaff overlaps before write"
    - "Explicit tenantId in all create() data payloads alongside forTenant() — Prisma type system requirement"
    - "Phase 2/3 stubs: empty @Module({}) shells with no controllers/providers — no accidental routing"
key_files:
  created:
    - packages/shared-types/src/interfaces/vendor.interface.ts
    - backend/src/modules/n8n/n8n-events.enum.ts
    - backend/src/modules/n8n/n8n.service.ts
    - backend/src/modules/n8n/n8n.module.ts
    - backend/src/common/email/email.service.ts
    - backend/src/common/email/email.module.ts
    - backend/src/modules/vendors/dto/vendor.dto.ts
    - backend/src/modules/vendors/vendors.service.ts
    - backend/src/modules/vendors/vendors.controller.ts
    - backend/src/modules/vendors/vendors.module.ts
    - backend/src/modules/calendar/dto/calendar-event.dto.ts
    - backend/src/modules/calendar/calendar.service.ts
    - backend/src/modules/calendar/calendar.controller.ts
    - backend/src/modules/calendar/calendar.module.ts
    - backend/src/modules/follow-ups/follow-ups.service.ts
    - backend/src/modules/follow-ups/follow-ups.controller.ts
    - backend/src/modules/follow-ups/follow-ups.module.ts
    - backend/src/modules/tracking/tracking.module.ts
    - backend/src/modules/referrals/referrals.module.ts
    - backend/src/modules/family-portal/family-portal.module.ts
    - backend/src/modules/memorial/memorial.module.ts
    - backend/src/modules/analytics/analytics.module.ts
    - backend/src/modules/multi-location/multi-location.module.ts
    - backend/src/modules/ai-obituary/ai-obituary.module.ts
    - backend/src/modules/chatbot/chatbot.module.ts
    - backend/src/modules/multi-faith/multi-faith.module.ts
  modified:
    - backend/src/app.module.ts
decisions:
  - "N8nService uses explicit EVENT_TO_ENV_VAR Record<N8nEvent, string> rather than template interpolation — webhook env var names differ from event names"
  - "EmailModule is @Global() so any future module can inject EmailService without re-importing"
  - "N8nModule is @Global() so VendorsService + FollowUpsService inject N8nService without explicit imports"
  - "9 Phase 2/3 stubs have no controllers/providers — zero routing surface, safe to register in AppModule now"
  - "tenantId added explicitly to all create() data payloads — required by Prisma type system even though forTenant() injects it at runtime"
metrics:
  duration_minutes: 45
  completed_date: "2026-04-09"
  tasks_completed: 9
  files_created: 26
  files_modified: 1
---

# Phase 05 Plan 05: Automation Modules + Stubs + Final Wiring Summary

**One-liner:** N8n webhook bridge + Resend/SES email service + vendors/calendar/follow-ups modules + 9 Phase 2/3 empty stubs wired into a complete AppModule that passes `npx tsc --noEmit` and `npm run build`.

## What Was Built

### Task 1 — IVendor interface patch (47e09ad)
Added `archivedAt: string | null` to `IVendor` in `packages/shared-types/src/interfaces/vendor.interface.ts`. This closes a Phase 3 carry-forward gap — the Prisma schema had `archivedAt` on `Vendor` since Phase 4 but the shared-types interface never received the field.

### Task 2 — N8nModule (80fe891)
- `n8n-events.enum.ts`: five N8nEvent values matching the 6 n8n workflows
- `n8n.service.ts`: `EVENT_TO_ENV_VAR` is an explicit `Record<N8nEvent, string>` object (not `N8N_WEBHOOK_${event}` interpolation). `onModuleInit()` logs `[PLACEHOLDER]` warnings for any unconfigured URL. `trigger()` silently skips if URL missing.
- `n8n.module.ts`: `@Global()` — available to all modules without re-import

### Task 3 — EmailModule (cd27ffd)
- `email.service.ts`: checks `EMAIL_PROVIDER` env var; routes to Resend (dev default) or SES (prod). Logs `[PLACEHOLDER]` if `RESEND_API_KEY` unset. Error-safe (`catch` prevents email failures from crashing requests).
- `email.module.ts`: `@Global()` — available project-wide

### Task 4 — VendorsModule (5517067)
- `UpsertVendorDto` + `AssignVendorDto` with class-validator decorators
- `VendorsService.assignToCase()` fires `N8nEvent.STAFF_NOTIFY` on vendor assignment (VEND-03)
- Soft-delete pattern: `deletedAt = new Date()` on DELETE

### Task 5 — CalendarModule (69db8fc)
- `CalendarService.assertNoDoubleBooking()`: queries `CalendarEventStaff` for overlapping time windows for assigned staff; throws `BadRequestException` before write (CAL-03)
- Both `create()` and `update()` run the double-booking check

### Task 6 — FollowUpsModule (38853df)
- `scheduleForCase()` creates 4 `FollowUp` records (1w/1mo/6mo/1yr offsets) then fires `GRIEF_FOLLOWUP_SCHEDULE` to n8n with all follow-up IDs

### Task 7 — 9 Phase 2/3 stub modules (d3567be)
All empty `@Module({})` shells registered to give Phase 2/3 work a landing zone. Phase 2: TrackingModule, ReferralsModule, FamilyPortalModule, MemorialModule, AnalyticsModule. Phase 3: MultiLocationModule, AiObituaryModule, ChatbotModule, MultiFaithModule.

### Task 8 — Final AppModule wiring (c9b8bce)
Full rewrite registering all 15 Phase 1 modules + 9 stubs + 4 globals (PrismaModule, EmailModule, N8nModule, CronModule). `CognitoAuthGuard` remains global `APP_GUARD`.

### Task 9 — End-to-end type check + build gate (f4ecc64)
`npx tsc --noEmit` passes with zero errors. `npm run build` produces `dist/main.js`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing tenantId in create() data payloads**
- **Found during:** Task 9 (type check gate)
- **Issue:** `vendors.service.ts`, `calendar.service.ts`, and `follow-ups.service.ts` all called `create()` without `tenantId` in the data object. The `forTenant()` extension injects `tenantId` at runtime but Prisma's TypeScript types require it in the compile-time data shape.
- **Fix:** Added explicit `tenantId` to `vendor.create`, `vendorAssignment.create`, `calendarEvent.create`, and `followUp.create` data objects — consistent with the pattern established in plans 05-03 and 05-04.
- **Files modified:** `vendors.service.ts`, `calendar.service.ts`, `follow-ups.service.ts`
- **Commit:** f4ecc64

**2. [Rule 3 - Blocking] Missing node_modules in worktree**
- **Found during:** Task 9 (initial tsc run)
- **Issue:** The git worktree does not inherit `node_modules` from the main repo checkout. The initial `npx tsc --noEmit` produced hundreds of "Cannot find module" errors.
- **Fix:** Ran `npm install --prefix backend` in the worktree to install dependencies locally before the type check.
- **Impact:** None — this is a worktree-specific setup issue, not a code issue.

## Known Stubs

All 9 Phase 2/3 stubs are intentional empty modules with no data source wired. They are registered in AppModule as landing zones for future phase work:

| Module | File | Phase | Reason |
|--------|------|-------|--------|
| TrackingModule | backend/src/modules/tracking/tracking.module.ts | 2 | Decedent chain-of-custody — deferred |
| ReferralsModule | backend/src/modules/referrals/referrals.module.ts | 2 | Referral source tracking — deferred |
| FamilyPortalModule | backend/src/modules/family-portal/family-portal.module.ts | 2 | Family collaboration portal — deferred |
| MemorialModule | backend/src/modules/memorial/memorial.module.ts | 2 | Public tribute pages — deferred |
| AnalyticsModule | backend/src/modules/analytics/analytics.module.ts | 2 | Revenue analytics — deferred |
| MultiLocationModule | backend/src/modules/multi-location/multi-location.module.ts | 3 | Multi-location groups — deferred |
| AiObituaryModule | backend/src/modules/ai-obituary/ai-obituary.module.ts | 3 | Claude API obituary drafting — deferred |
| ChatbotModule | backend/src/modules/chatbot/chatbot.module.ts | 3 | Embeddable chatbot — deferred |
| MultiFaithModule | backend/src/modules/multi-faith/multi-faith.module.ts | 3 | Faith tradition templates — deferred |

These stubs do not prevent the plan's goal — AppModule compiles cleanly and `dist/main.js` builds successfully.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced beyond what the plan's threat model covers. The N8nService outbound webhook calls are guarded by the `x-vigil-key` header (T-05-22). Webhook URLs are never logged (T-05-23). Stub modules have no controllers (T-05-27).

## Self-Check: PASSED

**Files verified:**

- `backend/src/modules/n8n/n8n.service.ts` — EXISTS
- `backend/src/modules/vendors/vendors.service.ts` — EXISTS
- `backend/src/modules/calendar/calendar.service.ts` — EXISTS
- `backend/src/common/email/email.service.ts` — EXISTS
- `backend/src/modules/tracking/tracking.module.ts` — EXISTS
- `backend/src/modules/multi-faith/multi-faith.module.ts` — EXISTS
- `backend/dist/main.js` — EXISTS (build passed)

**Commits verified:**
- 47e09ad — IVendor patch
- 80fe891 — N8nModule
- cd27ffd — EmailModule
- 5517067 — VendorsModule
- 69db8fc — CalendarModule
- 38853df — FollowUpsModule
- d3567be — 9 stub modules
- c9b8bce — Final AppModule wiring
- f4ecc64 — tenantId type fixes

**Type check:** `npx tsc --noEmit` — zero errors
**Build:** `npm run build` — `dist/main.js` produced
