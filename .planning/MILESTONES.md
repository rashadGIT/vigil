# Milestones

## v1.0 MVP (Shipped: 2026-04-14)

**Phases completed:** 11 phases · 53 plans · 142 commits  
**Files changed:** 357 · **Lines added:** 43,741 · **TypeScript LOC:** 5,284  
**Timeline:** Apr 5 → Apr 14, 2026 (9 days)

**Key accomplishments:**

1. Full multi-tenant NestJS backend — 14+ modules, Prisma `forTenant()` extension auto-injecting `tenantId` on all queries, two-stage soft delete, Cognito auth with offline `DEV_AUTH_BYPASS`
2. Complete Next.js 14 App Router frontend — case dashboard, 8-tab case workspace, mobile-first public intake form, e-signature capture, document management
3. 7 CDK stacks deployed — Foundation, Network, Auth, Data, Compute (ECS Fargate + ALB), Amplify (wildcard `*.vigilhq.com`), Observability; api.vigilhq.com live
4. 6 n8n automation workflows active — grief follow-ups (1w/1m/6m/1yr), staff notifications, intake pipeline, document generation, data retention cleanup, review requests
5. 5-layer test suite — Jest unit/component/contract/integration + Playwright E2E; tenant isolation test proves forTenant() isolation
6. One-command demo environment — `npm run demo:reset` seeds 2 tenants, 18-item price list, 3 Sunrise cases (Holloway/Chen/Abrams), 45 tasks, vendors, payments, follow-ups; 134-line DEMO.md sales script

**Requirements:** 69/70 satisfied (FLWP-04 partial — CronStubsService fires in local dev, minor)  
**Audit:** [.planning/v1.0-MILESTONE-AUDIT.md](v1.0-MILESTONE-AUDIT.md)

---
