---
status: complete
phase: 11-seed-data-demo-environment
source: 11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md, 11-04-SUMMARY.md, 11-05-SUMMARY.md
started: 2026-04-14T13:30:00Z
updated: 2026-04-14T13:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running services. Run `npm run demo:reset` (or seed directly). Seed completes without errors, printing tenant/case/task counts.
result: pass

### 2. Tenant + User Seed
expected: 2 tenants (sunrise, heritage), 4 users. Re-running seed produces identical output, no duplicates.
result: pass

### 3. FTC Price List (Sunrise only)
expected: Sunrise has 18 price list items across 4 categories. Heritage has zero price list items.
result: pass

### 4. Three Demo Cases
expected: Sunrise has James Holloway (new), Margaret Chen (in_progress), Robert Abrams (completed). Each has a primary FamilyContact. Heritage has zero cases.
result: pass

### 5. Task Checklists
expected: Holloway ~18 tasks, Chen ~15 tasks, Abrams ~12 tasks (all completed). Counts match service-type templates.
result: pass

### 6. Supporting Demo Data
expected: 4 vendors, 3 calendar events, payment + signed doc for Abrams, 2 obituaries, 4 follow-ups. Heritage has none.
result: pass

### 7. Tenant Isolation (Heritage empty)
expected: Cases, price items, vendors, follow-ups for Heritage return zero results.
result: pass

### 8. Idempotency
expected: Running seed twice produces identical output, no unique constraint violations.
result: pass

### 9. demo:reset script
expected: `npm run demo:reset` exists in package.json, brings up docker-compose + migrations + seed in one command.
result: pass

### 10. DEMO.md sales script
expected: DEMO.md at repo root with 15-minute timestamped walkthrough referencing Holloway, Chen, Abrams.
result: pass

### 11. README developer onboarding
expected: README.md at repo root with Local Dev section, DEV_AUTH_BYPASS instructions, new developer can onboard without questions.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
