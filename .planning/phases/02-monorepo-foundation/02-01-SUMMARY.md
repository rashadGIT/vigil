---
phase: 02-monorepo-foundation
plan: "01"
subsystem: monorepo-scaffold
tags: [workspace, typescript, tooling, npm]
dependency_graph:
  requires: []
  provides:
    - root-npm-workspace-config
    - tsconfig-base
    - eslint-prettier-config
    - workspace-tsconfig-stubs
  affects:
    - "02-02 (Docker Compose, .env.example)"
    - "02-03 (GitHub CI/CD workflows)"
    - "02-04 (CronStubsService shell)"
    - "03 (shared-types package)"
    - "05 (NestJS backend scaffold)"
    - "06 (Next.js frontend scaffold)"
    - "07 (CDK infrastructure)"
tech_stack:
  added:
    - "npm native workspaces"
    - "TypeScript 5.4.5 (flat extends pattern)"
    - "ESLint with @typescript-eslint/recommended"
    - "Prettier (semi, singleQuote, trailingComma: all)"
    - "concurrently ^8.2.2"
  patterns:
    - "Flat tsconfig extends — no project references or --build flag"
    - "Workspaces: backend, frontend, packages/*, infrastructure"
    - "Per-workspace type-check script: tsc --noEmit"
key_files:
  created:
    - package.json
    - tsconfig.base.json
    - .eslintrc.js
    - .prettierrc
    - .gitignore
    - .nvmrc
    - package-lock.json
    - backend/package.json
    - backend/tsconfig.json
    - backend/src/index.ts
    - frontend/package.json
    - frontend/tsconfig.json
    - frontend/src/index.ts
    - packages/shared-types/package.json
    - packages/shared-types/tsconfig.json
    - packages/shared-types/src/index.ts
    - infrastructure/package.json
    - infrastructure/tsconfig.json
    - infrastructure/lib/.gitkeep
    - infrastructure/lib/index.ts
    - infrastructure/bin/.gitkeep
  modified: []
decisions:
  - "D-01: npm native workspaces — backend, frontend, packages/*, infrastructure"
  - "D-02: Root scripts include dev (concurrently), build/test/lint (--workspaces --if-present), infra:synth, infra:deploy"
  - "D-03: Flat extends pattern — no TypeScript project references; each workspace tsconfig extends tsconfig.base.json via relative path"
  - "D-04: tsconfig.base.json: target ES2022, strict: true, skipLibCheck: true, forceConsistentCasingInFileNames: true"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 21
  files_modified: 0
---

# Phase 02 Plan 01: Root Workspace Skeleton Summary

npm workspaces wired with 4 workspace tsconfig stubs all extending a shared ES2022/strict base; `npx tsc --noEmit` passes across all workspaces.

## What Was Built

### Task 1: Root workspace config and tooling files (commit: 5a01604)

Created the 6 root-level config files that form the foundation for all downstream phases:

- **package.json** — npm workspaces root with `backend`, `frontend`, `packages/*`, `infrastructure`; all required scripts (dev, build, test, test:watch, test:coverage, test:e2e, test:e2e:ui, lint, type-check, infra:synth, infra:deploy)
- **tsconfig.base.json** — shared TypeScript config: ES2022 target, strict mode, skipLibCheck, forceConsistentCasingInFileNames, esModuleInterop
- **.eslintrc.js** — root ESLint with `@typescript-eslint/recommended`, `no-unused-vars` (with `_` prefix exception), `no-console` warning
- **.prettierrc** — semi: true, singleQuote: true, trailingComma: all, printWidth: 100
- **.gitignore** — excludes `.env` and `.env.*` but explicitly allows `.env.example`; also excludes dist, build, .next, cdk.out, node_modules
- **.nvmrc** — Node 20 LTS

### Task 2: Workspace stub files for all 4 workspaces (commit: 8d28a7e)

Created stub `package.json` and `tsconfig.json` for each workspace, plus minimal `src/` entry points so TypeScript has input files to process:

| Workspace | tsconfig extends | src stub |
|-----------|-----------------|----------|
| backend/ | ../tsconfig.base.json | src/index.ts (export {}) |
| frontend/ | ../tsconfig.base.json | src/index.ts (export {}) |
| packages/shared-types/ | ../../tsconfig.base.json | src/index.ts (Phase 3 comment + export {}) |
| infrastructure/ | ../tsconfig.base.json | lib/index.ts (Phase 7 comment + export {}) |

All workspace scripts are stub echo commands pointing to the implementing phase. `tsc --noEmit` passes on all 4 workspaces.

## TypeScript Extends Paths (Pattern for Downstream Phases)

Downstream phases must use these exact relative paths:

```
backend/tsconfig.json:           "extends": "../tsconfig.base.json"
frontend/tsconfig.json:          "extends": "../tsconfig.base.json"
packages/shared-types/tsconfig.json: "extends": "../../tsconfig.base.json"
infrastructure/tsconfig.json:    "extends": "../tsconfig.base.json"
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed shared-types tsconfig extends path**
- **Found during:** Task 2 verification (`npx tsc --noEmit --project packages/shared-types/tsconfig.json`)
- **Issue:** Plan specified `"../../../tsconfig.base.json"` (3 levels up) for `packages/shared-types/tsconfig.json`, but the correct relative path from `packages/shared-types/` to the repo root is only 2 levels up
- **Fix:** Changed to `"../../tsconfig.base.json"`
- **Files modified:** `packages/shared-types/tsconfig.json`
- **Commit:** 8d28a7e

**2. [Rule 1 - Bug] Added infrastructure/lib/index.ts to resolve TS18003**
- **Found during:** Task 2 verification
- **Issue:** `infrastructure/tsconfig.json` includes `lib/**/*` and `bin/**/*`, but only `.gitkeep` files existed — TypeScript emits TS18003 "no input files" error for empty include patterns
- **Fix:** Added `infrastructure/lib/index.ts` with `export {};` stub (same pattern as other workspaces)
- **Files modified:** `infrastructure/lib/index.ts` (new file)
- **Commit:** 8d28a7e

## Verification Results

All plan success criteria met:

- `package.json` has `"workspaces": ["backend", "frontend", "packages/*", "infrastructure"]` (D-01)
- Root scripts include all required scripts: dev, build, test, test:watch, test:coverage, test:e2e, test:e2e:ui, lint, type-check, infra:synth, infra:deploy (D-02)
- `tsconfig.base.json` has ES2022 target, strict: true, skipLibCheck: true, forceConsistentCasingInFileNames: true (D-04)
- All 4 workspace tsconfig.json files use flat extends pattern — no `references[]` arrays (D-03)
- `npm install` succeeded (added 39 packages, 0 vulnerabilities)
- `npx tsc --noEmit` passes on all 4 workspace tsconfig.json files
- `.gitignore` excludes `.env` and `.env.*` but includes `!.env.example`

## Known Stubs

These are intentional stubs — each workspace's scripts are echo placeholders pointing to the implementing phase. They are tracked here so downstream phases know to replace them:

| File | Stub | Implementing Phase |
|------|------|--------------------|
| backend/package.json | dev, build, start, lint scripts | Phase 5 (NestJS scaffold) |
| frontend/package.json | dev, build, start, lint scripts | Phase 6 (Next.js scaffold) |
| infrastructure/package.json | synth, deploy scripts | Phase 7 (CDK scaffold) |
| backend/src/index.ts | `export {}` | Phase 5 |
| frontend/src/index.ts | `export {}` | Phase 6 |
| packages/shared-types/src/index.ts | `export {}` | Phase 3 |
| infrastructure/lib/index.ts | `export {}` | Phase 7 |

These stubs do not block the plan's goal (workspace skeleton with passing tsc). They are intentional scaffolding to be replaced by later phases.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All files are local tooling/config. No threat flags.

## Self-Check: PASSED

All created files confirmed present and commits confirmed in git log.
