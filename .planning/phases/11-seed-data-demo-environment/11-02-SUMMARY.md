---
phase: 11-seed-data-demo-environment
plan: "02"
subsystem: backend/seed
tags: [seed, price-list, ftc, gpl, multi-tenancy]
dependency_graph:
  requires: [11-01]
  provides: [sunrise-price-list]
  affects: [backend/prisma/seed.ts]
tech_stack:
  added: []
  patterns: [findFirst+update idempotent seed pattern]
key_files:
  modified:
    - backend/prisma/seed.ts
decisions:
  - "PriceCategory enum values used as PriceCategory.xxx (not string literals) for strict TypeScript compliance"
  - "Heritage tenant deliberately receives no price list items per D-08"
  - "findFirst+update pattern preserves existing IDs and linked CaseLineItems on re-run"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-04-14"
  tasks_completed: 1
  files_modified: 1
---

# Phase 11 Plan 02: Price List Seed Summary

**One-liner:** Sunrise FTC GPL seeded with 18 PriceListItem rows across 4 categories using idempotent findFirst+update pattern; Heritage tenant intentionally empty.

## What Was Built

Extended `backend/prisma/seed.ts` with:

- `SUNRISE_PRICE_LIST` constant — 18 items covering all 4 PriceCategory values:
  - `professional_services`: 5 items (Basic Services $1,995 → Direct Cremation $895)
  - `facilities`: 4 items (Visitation $495 → Graveside $495)
  - `vehicles`: 4 items (Hearse $395 → Mileage $3.50/mi)
  - `merchandise`: 5 items (Cloth Casket $1,495 → Register Book $145)

- `seedPriceList(sunriseId)` function — iterates SUNRISE_PRICE_LIST, uses `findFirst` to check existence, then `update` or `create`. Fully idempotent: re-running seed updates prices without duplicating rows or breaking linked CaseLineItems.

- `main()` updated: calls `await seedPriceList(tenants.sunrise.id)` immediately after `seedUsers`.

Heritage tenant receives no price list items (pilot tier, D-08 decision).

## Deviations from Plan

None — plan executed exactly as written. Used `PriceCategory.xxx` enum member syntax instead of string literals for TypeScript strict-mode compliance.

## Known Stubs

None. Price list data is fully wired.

## Threat Flags

None beyond what the plan's threat model documents (T-11-05, T-11-06 — both accepted).

## Self-Check: PASSED

- `backend/prisma/seed.ts` exists with `seedPriceList` function and 18-item constant
- Commit `5c44180` recorded
