---
phase: 06
plan: 06
subsystem: frontend/public-routes
tags: [intake-wizard, e-signatures, public-api, mobile-first]
requires: [06-01-shadcn, 06-04-signature-canvas]
provides: [public-intake-form, public-signature-page]
affects: []
tech-stack-added: [public-api-client]
tech-stack-patterns: [multi-step-forms, state-machines, mobile-first-design]
key-files-created:
  - frontend/src/lib/api/public-client.ts
  - frontend/src/components/intake/intake-form.tsx
key-files-modified:
  - frontend/src/app/intake/[tenantSlug]/page.tsx
  - frontend/src/app/sign/[token]/page.tsx
decisions:
  - Public endpoints use separate publicApiClient with no auth headers
  - Intake wizard preserves state across Back/Continue navigation
  - Signature page uses state machine pattern for UX flow control
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_created: 2
  files_modified: 2
  commits: 2
  completed_at: "2026-04-09T19:56:30Z"
---

# Phase 06 Plan 06: Public Routes — Intake Wizard + Signature Page Summary

**One-liner:** Public 3-step intake wizard and mobile-first e-signature page using unauthenticated publicApiClient

## What Was Built

Implemented the two family-facing public routes: the intake form at `/intake/[tenantSlug]` and the e-signature page at `/sign/[token]`. Both routes are fully unauthenticated and mobile-optimized.

### Public API Client
Created `publicApiClient` — a separate axios instance without auth headers. This ensures public endpoints (intake submission, signature token validation, signature submission) work without Cognito authentication.

### Intake 3-Step Wizard
Built a mobile-first wizard following D-06 and D-07 decisions:
- **Step 1:** Deceased info (name, DOB, DOD, service type)
- **Step 2:** Family contact (name, phone, email, relationship)
- **Step 3:** Service preferences (special requests, notes)

Key features:
- Per-step validation with react-hook-form + zod
- State preservation across Back/Continue navigation
- Step indicators with checkmarks for completed steps
- Full-width inputs, 12px touch targets (D-07)
- Success screen after submission

### E-Signature Page
Implemented SIGN-02 with state machine pattern:
- **States:** loading → ready/expired/error → signing → signed
- Fetches signature request via `GET /signatures/token/:token`
- Validates token status (checks `signedAt` field)
- Uses SignatureCapture component from 06-04
- Submits signature via `POST /signatures/:token/sign`
- ESIGN/UETA legal compliance notice
- Mobile-optimized: 12px touch targets, responsive layout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed interface property mismatch**
- **Found during:** Task 2 (signature page implementation)
- **Issue:** Plan referenced `completedAt` property on ISignature, but actual interface uses `signedAt`
- **Fix:** Changed condition from `sig.completedAt` to `sig.signedAt` in signature page useEffect
- **Files modified:** `frontend/src/app/sign/[token]/page.tsx`
- **Commit:** 52b48a2

**2. [Rule 2 - Critical Functionality] Adjusted ServiceType enum usage**
- **Found during:** Task 1 (intake form implementation)
- **Issue:** Plan showed `ServiceType.BURIAL` pattern, but shared-types uses lowercase string literals ('burial', 'cremation', etc.) not uppercase enum members
- **Fix:** Used string literals in zod schema and type annotations, adjusted serviceTypeLabel to use lowercase keys
- **Files modified:** `frontend/src/components/intake/intake-form.tsx`
- **Commit:** 5302d3d

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 5302d3d | feat | Public API client + intake 3-step wizard |
| 52b48a2 | feat | Public e-signature page with mobile-first design |

## Verification

- [x] `cd frontend && npx tsc --noEmit` passes
- [x] Public API client created with no auth headers
- [x] Intake form implements 3-step wizard with per-step validation
- [x] Step indicators show progress with checkmarks
- [x] Form state preserved across Back/Continue
- [x] Signature page uses publicApiClient (no auth)
- [x] Signature page implements state machine (loading → ready → signing → signed)
- [x] Both pages use mobile-first design (h-12 touch targets, full-width inputs)
- [x] ESIGN/UETA legal notice included on signature page

## Known Stubs

None. Both public routes are fully functional and submit to their respective backend endpoints.

## Threat Flags

None. Both routes are public by design and use backend endpoints that do not require authentication. Rate limiting and input validation are handled at the backend level.

## Testing Notes

**Manual testing recommended:**
- Visit `http://localhost:3000/intake/sunrise` and complete all 3 steps
- Verify validation errors on empty required fields
- Test Back button preserves previous step data
- Verify success screen after submission
- Visit `http://localhost:3000/sign/any-token` and verify error handling for invalid token
- Test signature capture and submission flow

**Integration testing:**
- Backend endpoints `/intake/:slug` and `/signatures/token/:token` must be implemented
- Signature token generation and validation logic must be in place
- CORS must allow requests from frontend origin

## Self-Check: PASSED

**Created files exist:**
```
FOUND: frontend/src/lib/api/public-client.ts
FOUND: frontend/src/components/intake/intake-form.tsx
```

**Modified files exist:**
```
FOUND: frontend/src/app/intake/[tenantSlug]/page.tsx
FOUND: frontend/src/app/sign/[token]/page.tsx
```

**Commits exist:**
```
FOUND: 5302d3d
FOUND: 52b48a2
```

All files and commits verified successfully.
