---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stability & First Client
current_phase: 12
status: not_started
last_updated: "2026-04-14"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: ~
  completed_plans: 0
  percent: 0
---

# Session State

## Project Reference

See: .planning/PROJECT.md

**Core value:** Never miss a step in a service again
**Current focus:** Phase 12 — Hardening

## Position

**Milestone:** v1.1 Stability & First Client
**Current phase:** 12 — Hardening (not started)
**Status:** Roadmap defined, ready to plan Phase 12
**Last activity:** 2026-04-14 — v1.1 roadmap created (Phases 12-14)

## Progress Bar

```
v1.1: [ ][ ][ ] 0/3 phases complete
```

## Accumulated Context

- Multi-tenancy enforced via `forTenant()` Prisma extension — every query must go through it
- DEV_AUTH_BYPASS uses `NODE_ENV !== 'production'` guard (not `=== 'development'`)
- CronStubsService local dev guard is wrong direction — needs `NODE_ENV !== 'development'` (INFR-01, 1-line fix)
- Cognito stub cognitoSub format: `cognito-sub-{email-with-dashes}` — non-UUID, cannot collide with real subs
- Seed idempotency: `findFirst` + update/create pattern (not raw `upsert`) to preserve linked foreign keys
- n8n webhooks use `@InternalOnly()` guard (shared secret header), not Cognito
- Phase SECURITY.md captures accepted risks so future audits distinguish "accepted" from "missed"
- Staging CDK deploy must use separate RDS instance and separate Cognito user pool from production
- Review request workflow (RVWR-01/02/03) requires n8n + Twilio (SMS) + Resend/SES (email) wiring
