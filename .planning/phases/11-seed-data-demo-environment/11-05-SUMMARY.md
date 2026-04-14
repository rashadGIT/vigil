---
phase: 11-seed-data-demo-environment
plan: 05
subsystem: testing
tags: [demo, seed, onboarding, dev-tooling]

requires:
  - phase: 11-04
    provides: seed.ts with full demo data (vendors, events, payments, obituaries, follow-ups)

provides:
  - demo:reset one-command local dev setup script
  - demo:seed idempotent re-seed script
  - DEMO.md 15-minute sales script covering all demo beats
  - README.md with Local Dev section and DEV_AUTH_BYPASS onboarding instructions

affects: [onboarding, sales-demos, future-dev-setup]

tech-stack:
  added: []
  patterns:
    - "demo:reset = docker-compose up + prisma migrate deploy + prisma db seed"
    - "demo:seed = seed only, no DB rebuild (idempotent re-run)"

key-files:
  created:
    - DEMO.md
    - README.md
  modified:
    - package.json

key-decisions:
  - "Use prisma migrate deploy (not migrate dev) in demo:reset — safer for reproducible demo environment, avoids creating new migration files"
  - "DEMO.md references all 3 seeded cases by name: James Holloway, Margaret Chen, Robert Abrams"
  - "DEV_AUTH_BYPASS prod safety warning included in both DEMO.md and README.md"

patterns-established:
  - "Sales demo script: 15-minute flow with timestamps, direct sales language, no hedging"

requirements-completed: [SEED-04]

duration: 15min
completed: 2026-04-14
---

# Phase 11 Plan 05: Demo Harness Summary

**demo:reset one-command setup + 134-line DEMO.md sales script covering all 15 demo beats tied to seeded Holloway/Chen/Abrams cases**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-14T00:00:00Z
- **Completed:** 2026-04-14T00:15:00Z
- **Tasks:** 2 auto tasks complete (Task 3 is human-verify checkpoint — awaiting)
- **Files modified:** 3

## Accomplishments

- Added `demo:reset` and `demo:seed` scripts to root `package.json` — single command brings up DB, applies migrations, seeds demo data
- Created `README.md` with "Local Dev — One Command" section documenting DEV_AUTH_BYPASS flow, linking DEMO.md, and noting prod safety constraint
- Created `DEMO.md` — 134-line 15-minute sales script with timestamped beats from problem framing (0:00) to close (14:30), referencing all 3 seeded decedents by name, covering intake, overdue tasks, signatures, payments, follow-ups, price list, and tenant isolation

## Task Commits

1. **Task 1: demo:reset script + README Local Dev section** — `3837db1` (feat)
2. **Deviation: restore files deleted by soft reset** — `4b7e776` (chore)
3. **Task 2: DEMO.md 15-minute sales script** — `9b987f1` (feat)

## Files Created/Modified

- `package.json` — Added `demo:reset` and `demo:seed` scripts
- `README.md` — Created with Local Dev one-command section, scripts table, stack overview
- `DEMO.md` — 15-minute sales script with timestamps 0:00–14:30 and troubleshooting table

## Decisions Made

- Used `prisma migrate deploy` (not `migrate dev`) in `demo:reset` — `migrate dev` would create a new migration file on each run, which is wrong in a demo context. `migrate deploy` applies existing migrations idempotently.
- DEV_AUTH_BYPASS prod safety warning placed prominently in both README and DEMO.md per T-11-13 threat mitigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored seed.ts and prior SUMMARY files deleted by soft reset**
- **Found during:** Task 1 commit
- **Issue:** The `git reset --soft` to align this worktree's base commit staged deletions of `backend/prisma/seed.ts` and three prior SUMMARY.md files. These were swept into the Task 1 commit.
- **Fix:** Used `git checkout f3609ae -- ...` to restore all affected files, committed as a separate chore commit.
- **Files modified:** `backend/prisma/seed.ts`, `11-01-SUMMARY.md`, `11-02-SUMMARY.md`, `11-03-SUMMARY.md`
- **Committed in:** `4b7e776`

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary recovery step. No functional scope change.

## Issues Encountered

The worktree `git reset --soft` aligned the branch to the target base commit, but caused staged deletions of files created in prior plan commits. Detected immediately after Task 1 commit and recovered.

## User Setup Required

None — no external service configuration required. DEV_AUTH_BYPASS handles auth locally.

## Checkpoint Awaiting

**Task 3 (human-verify)** — End-to-end 15-minute demo walkthrough. The human must:
1. Run `docker-compose down -v && npm run demo:reset`
2. Start backend and frontend in separate terminals with bypass env vars
3. Follow DEMO.md from 0:00 → 14:30, verifying all listed beats
4. Confirm no duplicates on `npm run demo:seed` re-run

Resume signal: type "approved" or list beats that didn't work.

## Next Phase Readiness

Phase 11 complete pending human-verify. All 5 plans executed. Demo environment is ready for sales use.

---
*Phase: 11-seed-data-demo-environment*
*Completed: 2026-04-14*
