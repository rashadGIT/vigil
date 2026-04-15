# Requirements: Vigil

**Defined:** 2026-04-14
**Milestone:** v1.1 — Stability & First Client
**Core Value:** Never miss a step in a service again

## v1.1 Requirements

### Infrastructure & Bug Fixes

- [ ] **INFR-01**: CronStubsService does not fire @Cron decorators in local development (guard changed to `NODE_ENV !== 'development'`)
- [ ] **INFR-02**: All 6 n8n workflows are confirmed Active in production dashboard (human-verified)

### Client Onboarding

- [ ] **ONBD-01**: Operator can provision a new tenant via a documented runbook (slug, Cognito group, DB seed)
- [ ] **ONBD-02**: A staging environment exists where new tenants can be validated before going live
- [ ] **ONBD-03**: Staging environment mirrors production stack (same CDK stacks, separate RDS/Cognito)

### Review Request Workflow

- [ ] **RVWR-01**: Review request n8n workflow sends Google review SMS to family contact 14 days post-service
- [ ] **RVWR-02**: Review request n8n workflow sends Google review email to family contact 14 days post-service
- [ ] **RVWR-03**: Review request workflow is end-to-end tested (trigger → SMS + email delivered, verifiable in n8n execution log)

## v2 Requirements

### Expansion Modules (after 2-3 clients)

- **FAMP-01**: Family collaboration portal — secure link for families to view case details, upload photos, approve obituary, see payments
- **CUST-01**: Body/decedent chain-of-custody tracking — status board from pickup to final disposition
- **ANLT-01**: Referral source tracking — per-tenant analytics
- **PWA-01**: Mobile PWA — installable shell, offline reads for case list + task checklist
- **PREP-01**: Pre-planning portal — public form for families to pre-plan
- **MEMO-01**: Memorial/tribute pages — `memorial.vigilhq.com/[slug]`, photo gallery, guestbook, SEO
- **PMNT-01**: Payment installment plans — Stripe integration, balance tracking

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI obituary drafting | Phase 3 item — requires client feedback first |
| Multi-faith workflow engine | Phase 3 — deferred until 2-3 clients onboarded |
| Multi-location dashboard | Phase 3 — deferred until ownership group prospect |
| Analytics dashboard | Phase 3 — deferred |
| Real-time chat | High complexity, v3+ |
| Native iOS/Android apps | PWA covers mobile in Phase 2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 12 | Pending |
| INFR-02 | Phase 12 | Pending |
| ONBD-01 | Phase 13 | Pending |
| ONBD-02 | Phase 13 | Pending |
| ONBD-03 | Phase 13 | Pending |
| RVWR-01 | Phase 14 | Pending |
| RVWR-02 | Phase 14 | Pending |
| RVWR-03 | Phase 14 | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 8/8 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 — roadmap created, all requirements mapped*
