# Vigil

## What This Is

Vigil is a multi-tenant SaaS platform for independent funeral homes. Each funeral home gets its own isolated workspace; every new client is configuration, not a rebuild. The anchor product is a Funeral Operations System: digital intake, case management, task checklists, e-signatures, FTC GPL compliance, and automated grief follow-ups — demoed and sold in 15 minutes.

v1.0 shipped 2026-04-14: full-stack platform deployed to AWS, 6 n8n automation workflows live, demo-ready with one command.

## Core Value

Never miss a step in a service again — every case has a complete, automated checklist from intake to follow-up so nothing falls through the cracks during the highest-stress moments.

## Requirements

### Validated

- ✓ Multi-tenant architecture — `tenantId` on every table, Prisma `forTenant()` auto-injects on all queries — v1.0
- ✓ AWS Cognito auth — single User Pool, `custom:tenantId` + `custom:role`, `CognitoAuthGuard` with `DEV_AUTH_BYPASS` — v1.0
- ✓ Digital family intake form — `[slug].vigilhq.com/intake`, atomically creates case + tasks + follow-ups — v1.0
- ✓ Case dashboard — DataTable with status, assigned staff, overdue indicators — v1.0
- ✓ Per-case workspace — 8-tab view: info, contacts, tasks, documents, payments, signatures, vendors, calendar — v1.0
- ✓ Staff task checklist — templated by service type (burial/cremation/graveside/memorial) — v1.0
- ✓ Auto-generated obituary draft — interpolates intake data into editable template — v1.0
- ✓ Document storage — S3 presigned PUT/GET, private buckets, 15-min signed URLs — v1.0
- ✓ Basic payment tracking — amount owed, paid, outstanding per case — v1.0
- ✓ Grief follow-up automation — n8n: emails at 1w, 1mo, 6mo, 1yr post-service — v1.0
- ✓ E-signatures — any device, ESIGN/UETA audit trail, PDF receipt — v1.0
- ✓ FTC General Price List compliance — price list editor + PDF via pdfkit → S3 — v1.0
- ✓ Vendor coordination — directory CRUD + per-case assignment + n8n staff notification — v1.0
- ✓ Calendar & scheduling — event types, case-linked, staff assignment — v1.0
- ✓ Document generation — service program PDF from case data — v1.0
- ✓ Staff settings — branding, staff management, task template customization — v1.0
- ✓ Subdomain routing — `[slug].vigilhq.com` via Next.js middleware + Amplify wildcard — v1.0
- ✓ AWS CDK infrastructure — 7 stacks deployed: Foundation, Network, Auth, Data, Compute, Amplify, Observability — v1.0
- ✓ CI/CD — GitHub Actions ci.yml + security.yml + dependabot.yml — v1.0
- ✓ 5-layer test suite — unit/component/contract/integration/E2E; tenant isolation verified — v1.0
- ✓ Demo environment — `npm run demo:reset`, 2 tenants, 3 cases, 15-min DEMO.md script — v1.0

### Active

**v1.1 — Stability & First Client**

- [ ] Fix CronStubsService local dev guard — currently fires @Cron in dev (should be dev-disabled)
- [ ] Verify all 6 n8n workflows Active status in production (human confirmation)
- [ ] First client onboarding — tenant provisioning runbook, staging environment
- [ ] Review request workflow end-to-end test (Google review SMS + email 14 days post-service)

**Phase 2 — Expansion Modules (after 2-3 clients)**

- [ ] Family collaboration portal — secure link: families view details, upload photos, approve obituary, see payments
- [ ] Body/decedent chain-of-custody tracking — status board from pickup → final disposition
- [ ] Referral source tracking — per-tenant analytics
- [ ] Mobile PWA — installable shell, offline reads for case list + task checklist
- [ ] Pre-planning portal — public form for families to pre-plan
- [ ] Memorial/tribute pages — `memorial.vigilhq.com/[slug]`, photo gallery, guestbook, SEO
- [ ] Payment installment plans — Stripe integration, balance tracking
- [ ] Review generation — n8n auto-requests Google review 14 days post-service

**Phase 3 — Platform Maturity**

- [ ] AI obituary drafting — `claude-haiku-4-5` generates draft from intake data
- [ ] Multi-faith workflow engine — task checklists adapt by tradition
- [ ] Multi-location dashboard — ownership groups with multiple funeral homes
- [ ] Analytics dashboard — revenue trends, case volume, staff performance
- [ ] AI FAQ chatbot — embeddable on client's website

### Out of Scope

- Raw card number storage — Stripe for processing; platform records only
- Custom JWT / Clerk — Cognito owns all credential management
- BullMQ / Redis job queue — n8n cloud handles all async automation
- Railway / Supabase / Vercel — AWS-only deployment
- NAT Gateway / VPC interface endpoints — Fargate in public subnets; IGW only (saves $38/mo)
- Real-time chat — high complexity, defer to v3+
- Native iOS/Android apps — PWA covers mobile in Phase 2

## Context

**Shipped v1.0:** Full-stack funeral home SaaS on AWS. 5,284 TypeScript LOC, 357 files, 142 commits over 9 days.

- **Stack:** NestJS backend · Next.js 14 App Router · PostgreSQL via Prisma · AWS CDK (TypeScript)
- **AWS:** ECS Fargate, RDS PostgreSQL 16, ElastiCache Redis, ALB, S3, SES, Cognito, Amplify, Route53, ACM, Secrets Manager, CloudWatch
- **Automation:** n8n cloud (rashadbarnett.app.n8n.cloud) — 6 workflows
- **Monorepo:** `/backend` + `/frontend` + `/packages/shared-types` + `/infrastructure`
- **Domain:** vigilhq.com — api.vigilhq.com (ALB → Fargate), app.vigilhq.com (Amplify), `[slug].vigilhq.com/intake`
- **Target market:** Independent funeral homes (1-3 locations, family-owned), DFW-first
- **Sales motion:** Cold outreach → 15-min demo → pilot at $1,500 setup → Standard at $6K-$8K + $500-$700/mo
- **Local dev:** `npm run demo:reset` → fully offline with DEV_AUTH_BYPASS=true

**Known tech debt from v1.0:**
- CronStubsService fires @Cron in local dev (minor — production unaffected)
- n8n workflow Active status requires human verification in dashboard

## Constraints

- **Tech stack:** NestJS + Next.js 14 + Prisma + AWS CDK — no swapping core frameworks
- **Auth:** AWS Cognito only — no custom JWT, no Clerk, no Passport.js strategies
- **Deployment:** AWS-only — ECS Fargate + RDS + Amplify; no Railway/Supabase/Vercel in production
- **Async jobs:** n8n cloud only — no BullMQ, no cron jobs in production
- **Multi-tenancy:** Every DB table must have `tenantId`; every query must filter by it — no exceptions
- **Git:** Never `git commit` or `git push` — user commits manually
- **Security:** No secrets in `.env` files committed to git; all credentials in AWS Secrets Manager
- **Cost:** ~$40/mo early stage; ~$89/mo at 5+ clients

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AWS Cognito over custom JWT | Eliminates token storage in Redis, production-grade security from day one | ✓ Good — CognitoAuthGuard + DEV_AUTH_BYPASS works cleanly |
| n8n over BullMQ | Zero infrastructure, webhook-driven, visual editor, handles all 6 automation pipelines | ✓ Good — all 6 workflows deployed; PLACEHOLDER pattern caught missing URLs |
| Amplify Hosting over Vercel | Wildcard subdomain support per tenant without per-client domain config | ✓ Good — `*.vigilhq.com` wildcard works |
| Fargate in public subnets (no NAT) | Saves $38/mo; tight security groups provide equivalent security | ✓ Good — no issues encountered |
| `DEV_AUTH_BYPASS` mode | Fully offline local dev without AWS credentials | ✓ Good — `cognito-auth.guard.ts` warn log added for visibility |
| pdfkit for PDF generation | Pure Node.js, no external service, Buffer → S3 | ✓ Good — GPL + service program PDFs working |
| Prisma `forTenant()` extension | Auto-injects `tenantId` at ORM level; RLS as secondary defense | ✓ Good — tenant isolation test passes; arrow function bug fixed |
| Two-stage soft delete | 90-day recoverable → 7-year archived → hard delete | ✓ Good — `deletedAt` + `archivedAt` on all tenant models |
| `arguments[0]` pattern in forTenant() | Initial implementation used arrow function `arguments` binding | ⚠ Fixed — destructured `{ operation }` from `$allOperations` params |
| Seed idempotency via `upsert` | Seed re-runnable without duplicates; keyed on slug/email | ✓ Good — 2nd run produces identical output |

## Evolution

**After each phase transition:** move requirements, log decisions, check "What This Is" accuracy.
**After each milestone:** full review of all sections, Core Value check, Out of Scope audit, Context update.

---
*Last updated: 2026-04-14 after v1.0 milestone*
