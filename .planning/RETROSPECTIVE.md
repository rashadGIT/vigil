# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-14  
**Phases:** 11 | **Plans:** 53 | **Commits:** 142 | **Duration:** 9 days

### What Was Built

- Full NestJS backend with 14+ modules, Cognito auth, Prisma `forTenant()` multi-tenancy
- Next.js 14 App Router frontend — case dashboard, 8-tab workspace, mobile intake form, e-signatures
- 7 AWS CDK stacks deployed — api.vigilhq.com + app.vigilhq.com live
- 6 n8n automation workflows active — grief follow-ups, staff notifications, intake pipeline, document generation, data retention, review requests
- 5-layer test suite — Jest unit/component/contract/integration + Playwright E2E; tenant isolation test
- One-command demo environment — `npm run demo:reset`, 134-line DEMO.md sales script

### What Worked

- **GSD wave-based execution** — parallel worktree agents per wave dramatically accelerated delivery; 9 days for a full-stack platform
- **DEV_AUTH_BYPASS pattern** — offline local dev without AWS credentials eliminated setup friction across all phases
- **Atomic intake transaction** — single Prisma transaction for case + contact + tasks + follow-ups simplified the most complex flow
- **Idempotent seed with upserts** — re-runnable seed prevented demo environment drift across multiple iterations
- **forTenant() extension** — ORM-level multi-tenancy enforcement caught by integration test; cleaner than middleware approach
- **DEMO.md tied to seeded personas** — named personas (Holloway/Chen/Abrams) make the 15-min demo feel real, not synthetic

### What Was Inefficient

- **Worktree merge conflicts** — wave 2 merge (seed.ts extended by multiple agents) caused conflict; `--theirs` resolution lost Wave 1 SUMMARY.md, requiring manual restore commit
- **REQUIREMENTS.md checkbox tracking** — 68/70 requirements built but unchecked in file; checkbox state was not maintained during execution, requiring manual audit
- **Stale VERIFICATION.md** — Phase 5 verification documented bugs (forTenant arrow function, missing node_modules) that were fixed later but verification file was never updated, causing false gaps_found in audit
- **CronStubsService guard direction** — production guard (`NODE_ENV === 'production'`) is the wrong direction for a dev-only service; should be `NODE_ENV !== 'development'`

### Patterns Established

- Seed files use `findFirst` guard + update/create pattern (not `upsert`) to preserve linked foreign keys on re-runs
- Cognito stub cognitoSub format: `cognito-sub-{email-with-dashes}` — non-UUID, grep-detectable, cannot collide with real subs
- `@InternalOnly()` guard for n8n webhook callbacks — separate from Cognito auth, uses shared secret header
- Phase SECURITY.md captures accepted risks log so future audits can distinguish "accepted" from "missed"
- Demo personas use RFC-safe fictional identifiers: `example.com` emails, `555-01xx` phones, `192.0.2.x` IPs, fictional names

### Key Lessons

1. **Merge worktrees sequentially after each wave** — don't let stash+merge accumulate; the `git stash && merge && stash pop` pattern causes conflict when multiple waves touch the same file
2. **Tick REQUIREMENTS.md checkboxes as each plan executes** — end-of-milestone requirement audit should be a spot-check, not a full reconstruction
3. **Update VERIFICATION.md when bugs are fixed** — verification files are historical truth; a stale gaps_found creates misleading audit results
4. **Seed files grow unboundedly** — seed.ts was extended by 4 consecutive waves; consider splitting into `seed/tenants.ts`, `seed/cases.ts`, `seed/supporting.ts` for v1.1+
5. **CronStubs guard: use dev-negative, not prod-positive** — `NODE_ENV !== 'development'` is correct for a service that should be silent in dev

### Cost Observations

- Model mix: sonnet for execution agents, opus for planner/checker agents
- 9 days end-to-end for 11 phases, 53 plans, 5,284 LOC TypeScript
- Parallel worktree execution (waves with 1 plan each) was sequential in practice — dependency chain limited parallelism

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Duration | 9 days |
| Phases | 11 |
| Plans | 53 |
| LOC (TypeScript) | 5,284 |
| Requirements hit rate | 69/70 (98.6%) |
| Tech debt items | 4 |
