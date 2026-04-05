# Roadmap: Vigil

**Created:** 2026-04-05
**Milestone:** M1 — Phase 1 Funeral Operations System

---

## Phases

### Phase 1 — AWS Bootstrap & Monorepo Foundation

**Goal:** AWS account bootstrapped, IAM user created, CDK bootstrapped, monorepo skeleton in place with all config files, `.github/` CI/CD workflows, and Docker Compose running locally.

**Requirements covered:** INFR-01, INFR-07, INFR-09

**Plans:**
1. AWS account bootstrap — IAM admin user, CDK bootstrap, credentials verified via `aws sts get-caller-identity`
2. Monorepo skeleton — `/backend`, `/frontend`, `/packages/shared-types`, `/infrastructure` directories, root `package.json`, `.gitignore`, `.env.example` files
3. GitHub Actions — `ci.yml` (type-check, lint, build) + `security.yml` (npm audit, TruffleHog) + `dependabot.yml` + `SECURITY.md`
4. Docker Compose — Postgres 16 + Redis 7 + NestJS hot reload + Next.js dev; `docker-compose up` starts all services

**Done when:** `docker-compose up` starts without errors; `aws sts get-caller-identity` returns account ID; `npx tsc --noEmit` passes in all packages.

---

### Phase 2 — Shared Types & Database Schema

**Goal:** All TypeScript enums and interfaces in `packages/shared-types`, full Prisma schema with all Phase 1 tables + Phase 2/3 stubs, and first successful migration.

**Requirements covered:** AUTH-05, CASE-06, and schema foundation for all other requirements

**Plans:**
1. `packages/shared-types` — all enums (ServiceType, CaseStatus, TaskStatus, DocumentType, etc.) and interfaces (ICase, IUser, ITenant, etc.)
2. Prisma schema — all Phase 1 tables: Tenant, User, Case, FamilyContact, Task, Obituary, Document, Payment, FollowUp, Vendor, VendorAssignment, Signature, PriceListItem, CaseLineItem, CalendarEvent, CalendarEventStaff, AuditLog
3. Prisma schema Phase 2/3 stubs — DecedentTracking, ReferralSource, FamilyPortalAccess, MemorialPage, FaithTraditionTemplate, Location, AnalyticsSnapshot (schema only, no business logic)
4. Prisma migrate — first migration applied; `npx prisma migrate dev` passes; `npx prisma generate` produces typed client

**Done when:** `npx prisma migrate dev` applies without errors; all shared-types export correctly; `npx tsc --noEmit` passes.

---

### Phase 3 — NestJS Backend Scaffold (Day 10 MVP subset first)

**Goal:** Full NestJS application with all 14+ modules scaffolded. Day 10 MVP modules (auth, cases, contacts, tasks, intake) are fully implemented. All other Phase 1 modules are complete. Phase 2/3 module stubs exist as empty folders.

**Requirements covered:** AUTH-01 to AUTH-06, CASE-01 to CASE-06, INTK-01 to INTK-03, TASK-01 to TASK-04, OBIT-01 to OBIT-02, DOCS-01 to DOCS-03, PAY-01 to PAY-03, SIGN-01 to SIGN-04, GPL-01 to GPL-03, FLWP-01 to FLWP-04, VEND-01 to VEND-03, CAL-01 to CAL-04, DGEN-01 to DGEN-02

**Plans:**
1. NestJS app init — `nest new backend`, Prisma integration, `CognitoAuthGuard` with `DEV_AUTH_BYPASS`, `auth.service.ts` proxying Cognito SDK, health controller with optional Redis check
2. Core modules (Day 10 MVP) — `cases/`, `contacts/`, `tasks/` with full CRUD + tenant isolation; `intake.controller.ts` atomic create pipeline
3. Document & payment modules — `documents/` (S3 presigned URL flow), `payments/`, `obituaries/`, `price-list/`, `signatures/`
4. Automation modules — `vendors/`, `calendar/`, `follow-ups/`, `n8n/` service (webhook dispatcher), `email/` service (Resend dev / SES prod), `pdf.service.ts` (pdfkit GPL + service program), `cron/cron-stubs.service.ts`
5. Common layer — `AuditLogInterceptor`, `ForTenantExtension` Prisma extension, `@InternalOnly()` guard for n8n callbacks, Swagger setup (dev only), global `ValidationPipe`

**Done when:** `npm run start:dev` starts; `GET /health` returns 200; all endpoints return 401 without auth; `DEV_AUTH_BYPASS=true` allows local requests; intake POST creates case + tasks atomically.

---

### Phase 4 — Next.js Frontend Scaffold

**Goal:** Full Next.js 14 App Router application with all routes scaffolded. Auth flow, case dashboard, case workspace with all tabs, and public routes (intake, sign) are fully implemented. Phase 2/3 routes exist as stubs.

**Requirements covered:** All frontend-facing requirements across CASE, INTK, TASK, OBIT, DOCS, PAY, SIGN, GPL, VEND, CAL, SETT

**Plans:**
1. Next.js app init — `create-next-app`, Tailwind CSS, shadcn/ui, Amplify auth config, `middleware.ts` for tenant slug + auth guard
2. Auth flow — login page, Cognito Amplify integration, `auth.store.ts` (Zustand), `client.ts` with `DEV_AUTH_BYPASS` header injection
3. Day 10 MVP pages — case dashboard (DataTable), case workspace (tabbed), intake form (public), task checklist
4. Full Phase 1 pages — all workspace tabs (documents, payments, signatures, vendors, calendar), price list editor, vendor directory, settings pages
5. Public routes + PWA stub — `/sign/[token]`, `/intake/[tenantSlug]`, `/memorial/[caseId]` stub, `public/manifest.json`, `public/sw.js` shell, `<PwaRegister />` component
6. Mobile-responsive pass — all pages use Tailwind responsive prefixes; sidebar collapses on `md:`; DataTables horizontally scrollable

**Done when:** `npm run dev` starts; login redirects to dashboard; case dashboard loads cases from API; intake form submits and case appears in dashboard.

---

### Phase 5 — AWS CDK Infrastructure

**Goal:** All 7 CDK stacks synthesize and deploy. Backend reachable at `api.vigilhq.com/health`, frontend at `app.vigilhq.com`, Cognito User Pool live, RDS + Redis running, Amplify hosting configured.

**Requirements covered:** INFR-01 to INFR-06, INFR-08

**Plans:**
1. CDK project init — `infrastructure/` with TypeScript, `cdk.json`, all stack files scaffolded
2. Foundation + Network stacks — VPC (public + isolated subnets), S3 buckets, IAM roles, S3 Gateway endpoint
3. Auth + Data stacks — Cognito User Pool (custom attributes `tenantId`, `role`), RDS PostgreSQL (db.t4g.micro, isolated subnet), ElastiCache Redis (cache.t4g.micro, isolated subnet)
4. Compute + Amplify stacks — ECS Fargate service (public subnet, `assignPublicIp: true`), ALB, ACM cert, Amplify Hosting (GitHub integration, wildcard subdomain)
5. Observability stack — CloudWatch Log Groups, Sentry DSN in Secrets Manager, BetterUptime ping endpoint, RDS Performance Insights

**Done when:** `npx cdk deploy --all` completes; `curl https://api.vigilhq.com/health` returns `{"status":"ok"}`; frontend loads at `https://app.vigilhq.com`.

---

### Phase 6 — n8n Automation Workflows

**Goal:** All 6 n8n workflows created in rashadbarnett.app.n8n.cloud, activated, webhook URLs populated in environment, and N8nService no longer logs placeholder warnings.

**Requirements covered:** FLWP-01 to FLWP-03, VEND-03, and review/retention automation

**Plans:**
1. Workflow 1 — Grief Follow-Up Scheduler (webhook trigger → schedule 4 SES emails at 1wk/1mo/6mo/1yr)
2. Workflow 2 — Staff Notification Hub (new case, overdue task, vendor assignment → SES + SNS SMS)
3. Workflow 3 — Intake Notification (intake form submitted → notify assigned staff immediately)
4. Workflow 4 — Document Generation trigger (case complete → generate service program PDF via NestJS webhook)
5. Workflow 5 — Data Retention Cleanup (monthly CRON → hard delete records past 7-year archive window)
6. Workflow 6 — Review Request (14 days post-service → SMS + email Google review request using `googleReviewUrl`)

**Done when:** All 6 workflows show Active in n8n dashboard; test webhook triggers return 200; N8nService logs no `[PLACEHOLDER]` warnings on backend start.

---

### Phase 7 — Testing Suite

**Goal:** Full test suite covering all 5 layers (unit, component, contract, acceptance, E2E). `npm run test` passes with 80%+ coverage on business logic. Playwright E2E covers critical user journeys.

**Requirements covered:** TEST-01 to TEST-06

**Plans:**
1. Jest config + mocks — `jest.config.ts`, `__mocks__/` for `next/link`, `next/image`, `next/navigation`
2. Unit tests — `forTenant()` extension, `TaskTemplatesService`, `PdfService`, `EmailService` provider switching, `CognitoAuthGuard` bypass logic
3. Contract tests — `POST /intake/:slug` (creates case + tasks), `GET /cases` (tenant isolation), `POST /auth/login`, `GET /health`
4. Component tests — Case dashboard DataTable, intake form submission, signature capture component
5. Acceptance test — full intake → case created → task checklist visible flow
6. Tenant isolation test — Tenant A cannot read Tenant B cases, documents, or contacts
7. Playwright E2E — login → dashboard, intake form → case appears, case workspace navigation, sign page

**Done when:** `npm run test` passes; coverage report shows 80%+ on `tasks/`, `cases/`, `auth/` services; `npm run test:e2e` completes all Playwright specs.

---

### Phase 8 — Seed Data & Local Dev Polish

**Goal:** Complete demo environment seeded with 2 tenants, 4 cases, tasks, vendors, calendar events, signed documents, and realistic data matching the 15-minute demo script. Local dev runs in one command.

**Requirements covered:** SEED-01 to SEED-04

**Plans:**
1. `prisma/seed.ts` — 2 tenants (Sunrise Standard, Heritage Pilot), users per tenant, price lists, task templates
2. Demo cases — 3 Sunrise cases (new/in_progress/completed) with realistic deceased names, family contacts, tasks, notes
3. Demo supporting data — vendors, calendar events, payment records, signed documents, follow-up schedules, obituary drafts
4. Cognito user creation — `createCognitoUser()` uses `AdminCreateUserCommand` when creds present; falls back to stub `cognitoSub` offline
5. `docker-compose up && npx prisma db seed` one-command local demo — README documents exact steps

**Done when:** `npx prisma db seed` runs without errors; login with `director@sunrise.demo` / `Demo1234!` shows dashboard with 3 cases; 15-minute demo script is runnable end-to-end.

---

## Milestone Summary

**M1 Goal:** Fully scaffolded, demo-able platform. All Phase 1 features implemented. AWS deployed. Seed data loaded. 15-minute demo script runnable. Ready to sell.

**Day 10 checkpoint** (after Phase 3 partial + Phase 4 partial):
Login → case dashboard → case workspace → task checklist → intake form. 4 screens working end-to-end. Enough for first demo.

**Revenue target after M1:** First pilot client at $1,500 setup. Standard pricing ($6K-$8K setup + $500-$700/mo) after 2 case studies.

---
*Roadmap created: 2026-04-05*
