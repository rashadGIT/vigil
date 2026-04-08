---
phase: 04-prisma-schema
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, enums, multi-tenancy, soft-delete, cognito]

# Dependency graph
requires:
  - phase: 03-shared-types-package
    provides: 10 enums and 15 interfaces defining exact field names and optionality
  - phase: 02-monorepo-foundation
    provides: backend/ directory with package.json and .env.example

provides:
  - backend/prisma/schema.prisma with datasource, generator, 10 enums, 9 core models
  - Prisma 5.x pinned in backend/package.json
  - AUTH-05 enforced: tenantId on every non-Tenant model
  - CASE-06 enforced: deletedAt + archivedAt on Case, Document, User

affects: [05-nestjs-backend, 04-02-plan, 04-03-plan, 04-04-plan, 04-05-plan]

# Tech tracking
tech-stack:
  added: [prisma@^5.22.0 (devDependency), "@prisma/client@^5.22.0 (dependency)"]
  patterns:
    - "@@map on every model: @@map(\"snake_case_table_name\") + @map(\"snake_case_column\") on every field"
    - "tenantId String @map(\"tenant_id\") on every non-Tenant model"
    - "Two-stage soft delete: deletedAt DateTime? + archivedAt DateTime? on Case, Document, User"
    - "cognitoSub String @unique — no passwordHash field anywhere"
    - "FollowUpTemplate uses @map for digit-prefixed values (one_week @map(\"1_week\"))"

key-files:
  created:
    - backend/prisma/schema.prisma
    - backend/.gitignore
  modified:
    - backend/package.json
    - package-lock.json

key-decisions:
  - "Prisma 5.x pinned (NOT 7.x) — Prisma 7 requires breaking generator/adapter changes that belong in Phase 5"
  - "cognitoSub is non-nullable on User — Phase 11 seed supplies placeholder strings for demo users"
  - "deletedAt + archivedAt on Case, Document, User (CASE-06 two-stage retention)"
  - "FollowUpTemplate @map pattern for digit-prefixed enum values (one_week @map('1_week'))"
  - "Tenant back-relations included in schema so plans 04-02 through 04-04 can extend cleanly"

patterns-established:
  - "Schema spine pattern: single schema.prisma file extended by subsequent plans"
  - "All multi-word columns use @map(\"snake_case\") — TypeScript stays camelCase, DB stays snake_case"
  - "Every model has @@index([tenantId]) or compound index including tenantId for query efficiency"

requirements-completed: [AUTH-05, CASE-06]

# Metrics
duration: 8min
completed: 2026-04-08
---

# Phase 4 Plan 01: Prisma Schema Core Models Summary

**Prisma 5.x installed in backend with schema.prisma defining 10 enums and 9 core models (Tenant through FollowUp) with full @@map snake_case convention, two-stage soft delete, and multi-tenant tenantId enforcement**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-08T03:00:00Z
- **Completed:** 2026-04-08T03:08:29Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Prisma 5.22.0 installed (`prisma` devDep + `@prisma/client` runtime dep) — explicitly NOT 7.x per plan constraint
- `backend/prisma/schema.prisma` created with datasource (DATABASE_URL env), generator (prisma-client-js), all 10 enums, and 9 core models
- All 10 enums mirror `@vigil/shared-types` exactly; `FollowUpTemplate` uses `@map` for digit-prefixed values
- AUTH-05 enforced: `tenantId` present on all 9 non-Tenant models (27 occurrences total)
- CASE-06 enforced: `deletedAt` + `archivedAt` on Case, Document, User
- No `passwordHash` anywhere — `cognitoSub String @unique` is the sole auth identifier
- `npx prisma validate` passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Prisma 5.x and scaffold schema.prisma** - `ad2f2fd` (feat)

## Files Created/Modified

- `backend/prisma/schema.prisma` - Datasource, generator, 10 enums, 9 core models with full @@map convention
- `backend/.gitignore` - Excludes .env, node_modules, dist, prisma migrations .DS_Store
- `backend/package.json` - Added prisma@^5.22.0 devDep + @prisma/client@^5.22.0 dep
- `package-lock.json` - Updated with Prisma 5.x packages

## Decisions Made

- Prisma 5.x pinned (not 7.x): plan explicitly prohibits 7.x due to breaking generator/adapter changes that belong in Phase 5 NestJS scaffold
- `FollowUpTemplate` uses `@map` for each variant: `one_week @map("1_week")` etc. — Prisma identifiers cannot start with a digit
- Added `FamilyContact` back-relation on `FollowUp` model (`contact FamilyContact @relation(...)`) for `contactId` FK — required for schema validation to pass even though not in the plan's model block spec; this is a correctness requirement
- Added required D-11 indexes (Case compound indexes, Task composite, FollowUp composite) during this plan since they're needed for schema correctness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added FamilyContact relation on FollowUp for contactId FK**
- **Found during:** Task 1 (schema creation)
- **Issue:** FollowUp has `contactId String @map("contact_id")` which requires a `@relation` to FamilyContact for Prisma to validate; omitting it would cause a validation error
- **Fix:** Added `contact FamilyContact @relation(fields: [contactId], references: [id])` to FollowUp model and added `followUps FollowUp[]` back-relation on FamilyContact
- **Files modified:** backend/prisma/schema.prisma
- **Verification:** `npx prisma validate` passes
- **Committed in:** ad2f2fd (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added compound indexes from D-11 spec**
- **Found during:** Task 1 (schema creation)
- **Issue:** Plan action section didn't include index definitions in the schema snippet, but CONTEXT.md D-11 requires them
- **Fix:** Added `@@index([tenantId, status])`, `@@index([tenantId, assignedToId])`, `@@index([tenantId, createdAt(sort: Desc)])` on Case; `@@index([tenantId, completed, dueDate])` on Task; `@@index([status, scheduledAt])`, `@@index([tenantId, caseId])` on FollowUp
- **Files modified:** backend/prisma/schema.prisma
- **Verification:** `npx prisma validate` passes
- **Committed in:** ad2f2fd (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for schema correctness and future query performance. No scope creep.

## Issues Encountered

- `npx prisma validate` requires DATABASE_URL env var to be set even for schema-only validation — ran with `DATABASE_URL="postgresql://..."` prefix (local dev URL from .env.example). Not a blocker; production URL lives in Secrets Manager per T-04-04.

## User Setup Required

None - no external service configuration required for schema creation. DATABASE_URL is read from env at runtime; local dev uses `backend/.env` (gitignored, not committed).

## Next Phase Readiness

- `backend/prisma/schema.prisma` is ready for plans 04-02, 04-03, 04-04 to append models
- Tenant back-relations pre-defined so subsequent plans can add relations without editing existing model blocks
- `npx prisma migrate dev` (plan 04-05) can proceed once Docker Compose postgres is running
- Phase 5 NestJS scaffold can use `@prisma/client` generated types once `prisma generate` runs in plan 04-05

---
*Phase: 04-prisma-schema*
*Completed: 2026-04-08*

## Self-Check: PASSED

- FOUND: backend/prisma/schema.prisma
- FOUND: backend/.gitignore
- FOUND: .planning/phases/04-prisma-schema/04-01-SUMMARY.md
- FOUND: commit ad2f2fd
- `npx prisma validate` passes
