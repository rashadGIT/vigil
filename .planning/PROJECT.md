# Vigil

## What This Is

Vigil is a multi-tenant SaaS platform for independent funeral homes. Each funeral home gets its own isolated workspace; every new client is configuration, not a rebuild. The anchor product is a Funeral Operations System: digital intake, case management, task checklists, e-signatures, FTC GPL compliance, and automated grief follow-ups — demoed and sold in 15 minutes.

## Core Value

Never miss a step in a service again — every case has a complete, automated checklist from intake to follow-up so nothing falls through the cracks during the highest-stress moments.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Phase 1 — Funeral Operations System (demo-able in 15 min, deliverable in 7 weeks)**

- [ ] Multi-tenant architecture — every table scoped by `tenantId`, Prisma `forTenant()` extension auto-injects filter on all queries
- [ ] AWS Cognito auth — single User Pool, `custom:tenantId` + `custom:role` attributes, `CognitoAuthGuard` with `DEV_AUTH_BYPASS` for local dev
- [ ] Digital family intake form — public URL at `[slug].vigilhq.com/intake`, embeddable on client website, auto-creates case + tasks + follow-ups atomically
- [ ] Case dashboard — DataTable listing all cases with status, assigned staff, and overdue indicators
- [ ] Per-case workspace — tabbed view: deceased info, family contacts, tasks, documents, payments, notes, signatures, vendors
- [ ] Staff task checklist — templated by service type (burial, cremation, graveside, memorial), per-case instances
- [ ] Auto-generated obituary draft — interpolates intake data into editable template
- [ ] Document storage — S3 presigned PUT upload flow, private buckets, 15-min signed GET URLs
- [ ] Basic payment tracking — amount owed, paid, outstanding per case (recording only, no card processing)
- [ ] Grief follow-up automation — n8n Workflow 1: emails at 1 week, 1 month, 6 months, 1 year post-service
- [ ] E-signatures — capture on any device, ESIGN/UETA compliant, full audit trail (signer name, email, IP, timestamp, document hash)
- [ ] FTC General Price List (GPL) compliance — itemized price list editor + PDF auto-generation via pdfkit
- [ ] Vendor coordination — directory CRUD + per-case assignment + n8n staff notification on assignment
- [ ] Calendar & scheduling — chapel, vehicle, staff scheduling; prevents double-bookings
- [ ] Document generation templates — service program PDF from case data
- [ ] Staff settings — funeral home branding, staff management, task template customization
- [ ] Subdomain routing — `[slug].vigilhq.com` per tenant via Next.js middleware + Amplify wildcard

**Phase 1.5 — Polish Layer (after first client, included in retainer)**

- [ ] Vendor coordination operational depth — confirmation tracking, status board
- [ ] Calendar UI — monthly/weekly view with case color-coding
- [ ] Document generation templates — auto-populated from case data

**Phase 2 — Expansion Modules (after 2-3 clients)**

- [ ] Family collaboration portal — secure link: families view details, upload photos, approve obituary, see payments
- [ ] Body/decedent chain-of-custody tracking — status board from pickup → final disposition
- [ ] Referral source tracking — where did this case come from? Aggregated per-tenant analytics
- [ ] Mobile PWA — installable shell, offline reads for case list + task checklist
- [ ] Pre-planning portal — public form for families to pre-plan; auto-routes to staff
- [ ] Memorial/tribute pages — hosted at `memorial.vigilhq.com/[slug]`, photo gallery, guestbook, SEO
- [ ] Payment installment plans — Stripe integration, balance tracking
- [ ] Review generation — n8n auto-requests Google review 14 days post-service via SMS + email

**Phase 3 — Platform Maturity**

- [ ] AI obituary drafting — `claude-haiku-4-5` generates draft from intake data
- [ ] Multi-faith workflow engine — `FaithTraditionTemplate` per tenant; task checklists adapt by tradition (Catholic, Jewish, Muslim, Hindu, secular)
- [ ] Multi-location dashboard — `Location` model; ownership groups with multiple funeral homes
- [ ] Analytics dashboard — revenue trends, case volume, staff performance (`AnalyticsSnapshot`)
- [ ] AI FAQ chatbot — embeddable on client's website

### Out of Scope

- Raw card number storage — use Stripe for card processing; platform records payments only
- Custom JWT signing / Clerk — Cognito owns all credential management
- BullMQ / Redis job queue — n8n cloud handles all async automation
- Railway / Supabase / Vercel — AWS-only deployment (ECS Fargate, RDS, Amplify)
- NAT Gateway / VPC interface endpoints — Fargate in public subnets with `assignPublicIp: true`; IGW only
- Real-time chat between families and staff — high complexity, defer to v3+
- Native iOS/Android apps — PWA covers mobile in Phase 2; app store not needed for v1

## Context

- **Stack:** NestJS backend · Next.js 14 App Router · PostgreSQL via Prisma · AWS CDK (TypeScript)
- **AWS services:** ECS Fargate (backend), RDS PostgreSQL, ElastiCache Redis, ALB, S3, SES, Cognito, Amplify Hosting, Route53, ACM, Secrets Manager, CloudWatch
- **Automation:** n8n cloud (rashadbarnett.app.n8n.cloud) — 6 workflows covering grief follow-ups, staff notifications, intake pipeline, document generation, data retention, review requests
- **Monorepo:** `/backend` + `/frontend` + `/packages/shared-types` + `/infrastructure`
- **Domain:** vigilhq.com — wildcard `*.vigilhq.com` for tenant subdomain routing
- **Target market:** Independent funeral homes (1-3 locations, family-owned), DFW-first, then national
- **Demographic tailwind:** US 65+ population doubling by 2060; $13B market growing at 6% CAGR; cremation >60% driving margin pressure and tech receptivity
- **Competitive gap:** No modern platform targeting independents; enterprise players (Halcyon, Passare) ignore this segment; Gather is closest modern competitor
- **Sales motion:** Cold outreach → 15-min demo → pilot close at $1,500 setup → Standard at $6K-$8K setup + $500-$700/mo after 2 case studies
- **Day 10 MVP:** Login → case dashboard → case workspace → task checklist → intake form. 4 screens, end-to-end, enough for first demo.
- **Local dev:** Fully offline with `DEV_AUTH_BYPASS=true` — no AWS credentials required; Docker Compose runs Postgres + Redis locally

## Constraints

- **Tech stack:** NestJS + Next.js 14 + Prisma + AWS CDK — no swapping core framework choices
- **Auth:** AWS Cognito only — no custom JWT, no Clerk, no Passport.js strategies
- **Deployment:** AWS-only — ECS Fargate + RDS + Amplify; no Railway/Supabase/Vercel in production
- **Async jobs:** n8n cloud only — no BullMQ, no cron jobs in production (only `CronStubsService` for local dev)
- **Multi-tenancy:** Every DB table must have `tenantId`; every query must filter by it — no exceptions
- **Git:** Never `git commit` or `git push` — user commits manually
- **Security:** No secrets in `.env` files committed to git; all credentials in AWS Secrets Manager
- **Cost:** Target ~$40/mo early stage; ~$89/mo at 5+ clients; no NAT Gateway, no VPC interface endpoints

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AWS Cognito over custom JWT | Eliminates token storage in Redis, removes Passport.js complexity, production-grade security from day one | — Pending |
| n8n over BullMQ | Zero infrastructure to manage, webhook-driven, visual workflow editor, handles grief + notification + retention pipelines | — Pending |
| Amplify Hosting over Vercel | Wildcard subdomain support per tenant without custom domain configuration per client | — Pending |
| Fargate in public subnets (no NAT) | Saves $38/mo; tight security groups (inbound from ALB only) provide equivalent security | — Pending |
| `DEV_AUTH_BYPASS` mode | Allows fully offline local dev without AWS credentials; guards skip Cognito when env var set | — Pending |
| pdfkit for PDF generation | GPL and service program PDF; pure Node.js, no external service, outputs Buffer → S3 | — Pending |
| Prisma `forTenant()` extension | Auto-injects `tenantId` on all queries at ORM level; RLS as secondary defense | — Pending |
| Two-stage soft delete | 90-day recoverable → 7-year archived → hard delete; matches funeral home legal record retention requirements | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
