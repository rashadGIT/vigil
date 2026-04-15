# Roadmap: Vigil

## Milestones

- ✅ **v1.0 MVP** — Phases 1-11 (shipped 2026-04-14) — [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Stability & First Client** — Phases 12-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-11) — SHIPPED 2026-04-14</summary>

- [x] Phase 1: AWS Account Bootstrap (2/2 plans) — completed 2026-04-05
- [x] Phase 2: Monorepo Foundation (5/5 plans) — completed 2026-04-06
- [x] Phase 3: Shared Types Package (3/3 plans) — completed 2026-04-07
- [x] Phase 4: Prisma Schema (5/5 plans) — completed 2026-04-07
- [x] Phase 5: NestJS Backend Scaffold (5/5 plans) — completed 2026-04-09
- [x] Phase 6: Next.js Frontend Scaffold (6/6 plans) — completed 2026-04-10
- [x] Phase 7: CDK Project Init (3/3 plans) — completed 2026-04-10
- [x] Phase 8: AWS CDK Infrastructure Deployment (5/5 plans) — completed 2026-04-11
- [x] Phase 9: n8n Automation Workflows (6/6 plans) — completed 2026-04-12
- [x] Phase 10: Testing Suite (7/7 plans) — completed 2026-04-13
- [x] Phase 11: Seed Data & Demo Environment (5/5 plans) — completed 2026-04-14

</details>

## v1.1 — Stability & First Client

- [ ] **Phase 12: Hardening** - Fix CronStubsService local dev guard + verify all n8n workflows Active in production
- [ ] **Phase 13: Client Onboarding** - Tenant provisioning runbook + staging environment deployed and verified
- [ ] **Phase 14: Review Request Workflow** - Google review SMS + email n8n workflow wired, triggered, and confirmed in execution log

## Phase Details

### Phase 12: Hardening
**Goal**: Production automation is verified healthy and local development fires scheduled jobs correctly
**Depends on**: Phase 11 (v1.0 complete)
**Requirements**: INFR-01, INFR-02
**Success Criteria** (what must be TRUE):
  1. Running the backend locally triggers @Cron decorators — stubs fire and log output appears in dev console
  2. All 6 n8n workflows show Active status in the n8n production dashboard (human-verified, screenshot or checklist captured)
**Plans**: TBD

### Phase 13: Client Onboarding
**Goal**: A new funeral home client can be provisioned into the system and validated in staging before going live
**Depends on**: Phase 12
**Requirements**: ONBD-01, ONBD-02, ONBD-03
**Success Criteria** (what must be TRUE):
  1. Operator follows the runbook and a new tenant (slug, Cognito group, seeded DB record) exists in under 15 minutes with no ad-hoc decisions required
  2. A staging environment is reachable (separate URL, separate RDS instance, separate Cognito user pool) deployed from the same CDK stack definitions as production
  3. A test tenant provisioned in staging behaves identically to production — intake form loads, login works, case creation succeeds
**Plans**: TBD

### Phase 14: Review Request Workflow
**Goal**: Families automatically receive a Google review request via SMS and email 14 days after service completion
**Depends on**: Phase 13
**Requirements**: RVWR-01, RVWR-02, RVWR-03
**Success Criteria** (what must be TRUE):
  1. Triggering the workflow (manually or via case completion event) results in an SMS delivered to the family contact's phone number containing the tenant's Google review link
  2. Triggering the workflow results in an email delivered to the family contact's email address containing the Google review link
  3. The n8n execution log shows a successful end-to-end run with no failed nodes — verifiable without production data
**Plans**: TBD

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. AWS Account Bootstrap | v1.0 | 2/2 | ✅ Complete | 2026-04-05 |
| 2. Monorepo Foundation | v1.0 | 5/5 | ✅ Complete | 2026-04-06 |
| 3. Shared Types Package | v1.0 | 3/3 | ✅ Complete | 2026-04-07 |
| 4. Prisma Schema | v1.0 | 5/5 | ✅ Complete | 2026-04-07 |
| 5. NestJS Backend Scaffold | v1.0 | 5/5 | ✅ Complete | 2026-04-09 |
| 6. Next.js Frontend Scaffold | v1.0 | 6/6 | ✅ Complete | 2026-04-10 |
| 7. CDK Project Init | v1.0 | 3/3 | ✅ Complete | 2026-04-10 |
| 8. AWS CDK Infrastructure Deployment | v1.0 | 5/5 | ✅ Complete | 2026-04-11 |
| 9. n8n Automation Workflows | v1.0 | 6/6 | ✅ Complete | 2026-04-12 |
| 10. Testing Suite | v1.0 | 7/7 | ✅ Complete | 2026-04-13 |
| 11. Seed Data & Demo Environment | v1.0 | 5/5 | ✅ Complete | 2026-04-14 |
| 12. Hardening | v1.1 | 0/TBD | Not started | - |
| 13. Client Onboarding | v1.1 | 0/TBD | Not started | - |
| 14. Review Request Workflow | v1.1 | 0/TBD | Not started | - |
