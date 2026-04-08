---
phase: 04-prisma-schema
plan: 05
subsystem: database
tags: [prisma, postgresql, migration, ecs, fargate, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: schema.prisma file and backend .gitignore with .env excluded
  - phase: 04-04
    provides: complete 24-table schema including Phase 2/3 stub tables
provides:
  - Initial migration SQL (20260408032002_init) with all 24 CREATE TABLE statements
  - Generated @prisma/client v6.19.3 typed client
  - backend/prisma/migrations/migration_lock.toml
  - backend/tsconfig.json with skipLibCheck for prisma generated types
  - ECS migration task pattern documentation for Phase 8
affects: [05-nestjs-backend, 08-aws-cdk-deployment, 11-seed-data]

# Tech tracking
tech-stack:
  added: [prisma@5.22.0 (migrate dev ran against local postgres), @prisma/client@5.22.0 generated]
  patterns: [forward-only migrations, pre-deploy ECS task for production migrations, vigil:vigil local postgres credentials]

key-files:
  created:
    - backend/prisma/migrations/20260408032002_init/migration.sql
    - backend/prisma/migrations/migration_lock.toml
    - .planning/phases/04-prisma-schema/ECS-MIGRATION-PATTERN.md
  modified:
    - backend/tsconfig.json (added skipLibCheck: true)
    - backend/.env (gitignored — not committed, local DATABASE_URL only)

key-decisions:
  - "Used port 5435 for migration postgres container because port 5432 was occupied by another project (snapspot-postgres)"
  - "backend/.env uses postgresql://vigil:vigil@localhost:5435/vigil_dev — port differs from docker-compose.yml default (5432) due to port conflict"
  - "ECS vigil-migrations task runs to completion before vigil-backend service update to eliminate migration race condition"
  - "Prisma migrations are forward-only — rollback = new forward migration, never edit applied files"

patterns-established:
  - "Pattern: Pre-deploy migration task — vigil-migrations ECS one-shot task runs before service update in CD pipeline"
  - "Pattern: sslmode=require for all production DATABASE_URLs against RDS"
  - "Pattern: skipLibCheck in backend tsconfig prevents prisma generated types from breaking tsc --noEmit"

requirements-completed: [AUTH-05, CASE-06]

# Metrics
duration: 15min
completed: 2026-04-08
---

# Phase 4 Plan 05: Migration & Client Generation Summary

**Initial Prisma migration applied (24 tables, 627 SQL lines) with @prisma/client generated and backend tsc --noEmit passing clean**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-08T03:20:00Z
- **Completed:** 2026-04-08T03:35:00Z
- **Tasks:** 3
- **Files modified:** 5 (4 committed + 1 gitignored)

## Accomplishments
- Created `backend/prisma/migrations/20260408032002_init/migration.sql` with all 24 CREATE TABLE statements covering every Vigil model
- Generated `@prisma/client` v6.19.3 typed client, making Phase 5 NestJS imports resolvable
- `backend tsc --noEmit` passes cleanly with `skipLibCheck: true` added to tsconfig
- Documented production ECS `vigil-migrations` pre-deploy task pattern for Phase 8 (72-line reference doc)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backend/.env with DATABASE_URL and add skipLibCheck** - `50f4915` (chore)
2. **Task 2: Run prisma migrate dev --name init, generate client, verify tsc** - `de2bb9d` (feat)
3. **Task 3: Document production ECS migration task pattern** - `856ad12` (docs)

## Files Created/Modified
- `backend/prisma/migrations/20260408032002_init/migration.sql` - 627-line DDL for all 24 tables, enums, indexes, foreign keys
- `backend/prisma/migrations/migration_lock.toml` - Prisma migration provider lock
- `backend/tsconfig.json` - Added `skipLibCheck: true` to prevent generated prisma types from breaking tsc
- `backend/.env` - Local DATABASE_URL (gitignored, NOT committed)
- `.planning/phases/04-prisma-schema/ECS-MIGRATION-PATTERN.md` - 72-line production migration strategy reference

## Decisions Made
- **Port 5435 for migration**: Port 5432 was occupied by another project's postgres container. Started a temporary `vigil_postgres_migration` container on 5435 to run the migration. The docker-compose.yml default of 5432 remains unchanged for when the standard compose stack runs.
- **skipLibCheck**: Added to tsconfig because `@prisma/client` generated declaration files can reference types not yet in the full NestJS dependency graph — this is standard practice for Prisma+NestJS projects.
- **ECS pre-deploy pattern**: Documented as one-shot `run-task` (not a service) so exactly one migration task completes with exit code 0 before any new backend instances come online.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Port 5432 conflict — started vigil postgres on 5435**
- **Found during:** Task 2 (docker-compose up -d postgres)
- **Issue:** Port 5432 was already bound by `snapspot-postgres` (another local project). `docker-compose up -d postgres` would have failed.
- **Fix:** Ran `docker run ... -p 5435:5432 postgres:16-alpine` with vigil credentials to create a temporary migration container. Set `DATABASE_URL` in `.env` to `localhost:5435`.
- **Files modified:** backend/.env (uses port 5435 instead of 5432)
- **Verification:** Migration ran successfully; prisma validate, generate, and tsc --noEmit all passed
- **Committed in:** Not applicable — .env is gitignored; tsconfig committed in 50f4915

---

**Total deviations:** 1 auto-fixed (1 blocking — port conflict)
**Impact on plan:** Minimal scope — only the local DATABASE_URL port differs from docker-compose default. When the full docker-compose stack runs on a clean machine (port 5432 free), the standard URL applies.

## Issues Encountered
- Port 5432 occupied by `snapspot-postgres` container from another project on the same machine. Resolved by running vigil postgres on 5435 for the migration run. No impact on committed artifacts.

## User Setup Required
None — no external service configuration required. When running on a fresh machine with nothing on port 5432, use `docker-compose up -d postgres` and update `backend/.env` to `postgresql://vigil:vigil@localhost:5432/vigil_dev`.

## Next Phase Readiness
- Phase 5 (NestJS Backend Scaffold) can now import `@prisma/client` and get full TypeScript types for all 24 models
- `PrismaService` in Phase 5 just needs `new PrismaClient()` — no schema work required
- The `vigil_postgres_migration` Docker container can be stopped; Phase 5 local dev should use `docker-compose up -d postgres` (starts on 5432)
- Phase 8 plan 08-04 has a clear reference at `.planning/phases/04-prisma-schema/ECS-MIGRATION-PATTERN.md` for implementing the `vigil-migrations` ECS task definition

## Known Stubs
None — this plan generates infrastructure artifacts (migration SQL, client types, pattern docs), not UI or service code.

---
*Phase: 04-prisma-schema*
*Completed: 2026-04-08*
