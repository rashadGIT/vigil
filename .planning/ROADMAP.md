# Roadmap: Vigil

**Created:** 2026-04-05
**Source:** vigil-build-plan.md (Waves 0–9)
**Milestone:** M1 — Phase 1 Funeral Operations System

> Each phase maps 1:1 to a wave in `vigil-build-plan.md`. Read the full wave section before planning — it contains exact file structures, code patterns, and gotchas.

---

## Phases

### Phase 1 — AWS Account Bootstrap
**Wave:** 0

**Goal:** AWS account accessible, IAM admin user created (never use root for CDK), CLI configured, CDK bootstrapped in `us-east-2`. Account ID captured for use in `infrastructure/lib/config/environments.ts`.

**Requirements covered:** INFR-01 (prerequisite)

**Plans:**
1. Create IAM admin user — AWS Console → IAM → Users → AdministratorAccess policy → generate access key
2. Configure AWS CLI — `aws configure` (region: us-east-2, output: json)
3. Install and bootstrap CDK — `npm install -g aws-cdk` → `cdk bootstrap aws://ACCOUNT_ID/us-east-2`

**Done when:** `aws sts get-caller-identity` returns your Account ID, UserId, and ARN without error.

---

### Phase 2 — Monorepo Foundation
**Wave:** 1

**Goal:** Monorepo skeleton with root workspace config, all `.env.example` files, `.github/` CI/CD workflows, and Docker Compose running Postgres 16 + Redis 7 locally.

**Requirements covered:** INFR-07, INFR-09

**Plans:**
1. Root workspace — `package.json` (workspaces: backend, frontend, packages/*, infrastructure), `tsconfig.base.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`
2. `.env.example` files (3 total) — `backend/.env.example` (Cognito, S3, SES, n8n webhook placeholders, `DEV_AUTH_BYPASS`, `EMAIL_PROVIDER=resend`), `frontend/.env.example` (Amplify config, `NEXT_PUBLIC_DEV_AUTH_BYPASS`), `infrastructure/.env.example`
3. GitHub Actions — `ci.yml` (type-check + lint + build in parallel), `security.yml` (npm audit + TruffleHog PR diff + filesystem push scan), `dependabot.yml`, `SECURITY.md`
4. Docker Compose — `docker-compose.yml` (postgres:16-alpine port 5432 + redis:7-alpine port 6379, named volumes), `docker-compose.test.yml` (separate test DB instance)
5. `CronStubsService` stub — `backend/src/common/cron/cron-stubs.service.ts` (logs pending follow-up counts daily at 9am; never runs in production; fills gap before n8n Wave 9)

**Done when:** `docker-compose up` starts Postgres + Redis without errors; all 3 `.env.example` files created; `npx tsc --noEmit` passes at root.

---

### Phase 3 — Shared Types Package
**Wave:** 2

**Goal:** `packages/shared-types/` exports all TypeScript enums and interfaces mirroring the Prisma schema exactly. Single source of truth shared by both backend DTOs and frontend API clients.

**Requirements covered:** Type foundation for all modules

**Plans:**
1. Package scaffold — `packages/shared-types/package.json`, `tsconfig.json`, `src/index.ts`
2. Enums — `ServiceType`, `CaseStatus`, `UserRole`, `DocumentType`, `FollowUpTemplate`, `VendorType`, `SignatureDocument`, `PriceCategory`, `EventType`, `AuditAction`
3. Interfaces — one file per entity: `ITenant`, `IUser`, `ICase`, `IFamilyContact`, `ITask`, `IObituary`, `IDocument`, `IPayment`, `IFollowUp`, `IVendor`, `ISignature`, `IPriceListItem`, `ICaseLineItem`, `ICalendarEvent`, `IAuditLog`

**Done when:** `npx tsc --noEmit` passes in `packages/shared-types`; all enums and interfaces importable from `@vigil/shared-types`.

---

### Phase 4 — Prisma Schema
**Wave:** 3

**Goal:** Complete `backend/prisma/schema.prisma` with all Phase 1 tables, Phase 2/3 stubs, correct indexes, two-stage soft delete fields (`deletedAt` + `archivedAt`), and first successful migration.

**Requirements covered:** AUTH-05, CASE-06, and DB foundation for all other requirements

**Plans:**
1. Phase 1 tables — `Tenant` (feature flags + `googleReviewUrl`), `User` (`cognitoSub` replaces `passwordHash`), `Case` (`deletedAt` + `archivedAt` + nullable `faithTradition`), `FamilyContact`, `Task`, `Obituary`, `Document`, `Payment`, `FollowUp`, `Vendor`, `VendorAssignment`, `Signature` (`token` unique field for sign page), `PriceListItem`, `CaseLineItem`, `CalendarEvent`, `CalendarEventStaff` (join table — not array field), `AuditLog`
2. Required indexes — `Case` (tenantId+status, tenantId+assignedTo, tenantId+createdAt desc), `Task` (tenantId+completed+dueDate), `FollowUp` (status+scheduledAt, tenantId+caseId), `CalendarEvent` (tenantId+startTime+endTime), `AuditLog` (tenantId+entityType+entityId, tenantId+userId+createdAt), `Signature` (token)
3. Phase 2 stubs — `DecedentTracking`, `ReferralSource`, `FamilyPortalAccess`, `MemorialPage` (schema defined, zero service logic)
4. Phase 3 stubs — `FaithTraditionTemplate`, `Location`, `AnalyticsSnapshot` (schema defined, zero service logic)
5. Migration + production runner — `npx prisma migrate dev --name init` locally; add `vigil-migrations` ECS task definition in `compute-stack.ts` for pre-deploy migration runs (runs before ECS service update, not on app startup)

**Done when:** `npx prisma migrate dev` applies without errors; `npx prisma generate` produces typed client; `npx tsc --noEmit` passes in backend.

**Conventions (enforce in every model):**
- `@@map("snake_case")` on every model; `@map("snake_case")` on every field
- `@@index([tenantId])` on every table — never omit
- `AuditLog` and `Signature`: never hard-deleted (compliance evidence)
- `Payment`: never hard-deleted (financial/IRS records)
- Production `DATABASE_URL` must include `?sslmode=require`

---

### Phase 5 — NestJS Backend Scaffold
**Wave:** 4

**Goal:** Full NestJS application with all 14+ modules implemented. Day 10 MVP modules (auth, cases, contacts, tasks, intake) ship first. All Phase 1 modules complete. Phase 2/3 module stubs exist as empty folders only — no business logic.

**Requirements covered:** AUTH-01–06, CASE-01–06, INTK-01–03, TASK-01–04, OBIT-01–02, DOCS-01–03, PAY-01–03, SIGN-01–04, GPL-01–03, FLWP-01–04, VEND-01–03, CAL-01–04, DGEN-01–02

**Plans:**
1. App bootstrap — `nest new backend --strict`, `main.ts` (helmet, `ValidationPipe` whitelist+forbidNonWhitelisted, CORS two-config pattern, Swagger dev-only guard, port 3001)
2. Auth + common layer — `CognitoAuthGuard` (skips Cognito when `DEV_AUTH_BYPASS=true`, reads mock user from `x-dev-user` header; syncs `cognitoSub` via `updateMany` on real login), `auth.service.ts` (proxies `InitiateAuthCommand` + `AdminCreateUserCommand` to Cognito SDK, sets `httpOnly` refresh token cookie), `@InternalOnly()` guard for n8n callbacks (shared secret, not JWT), `AuditLogInterceptor`, `ForTenantExtension` Prisma extension (`forTenant()` auto-injects `tenantId` on all queries), health controller (`redis: 'disabled'` when `REDIS_URL` unset — not an error)
3. Day 10 MVP modules — `cases/` (CRUD + status transitions), `contacts/`, `tasks/` (CRUD + template engine + overdue detection), `intake.controller.ts` (Prisma transaction: case + contact + tasks + follow-ups created atomically)
4. Document + compliance modules — `documents/` (S3 presigned PUT 5-step flow + signed GET 15-min expiry), `payments/`, `obituaries/`, `price-list/` (GPL CRUD + case line items), `signatures/` (token generation + ESIGN/UETA audit trail), `pdf.service.ts` (pdfkit `generateGpl()` + `generateServiceProgram()` → Buffer → S3)
5. Automation modules + Phase 2/3 stubs — `vendors/`, `calendar/`, `follow-ups/`, `n8n/` (`N8nService` via `HttpService` from `@nestjs/axios` — logs `[PLACEHOLDER]` warning not error when webhook URL unset), `email/` (`EmailService` switches Resend↔SES via `EMAIL_PROVIDER`); Phase 2/3 stubs as empty folders: `tracking/`, `referrals/`, `family-portal/`, `memorial/`, `analytics/`, `multi-location/`, `ai-obituary/`, `chatbot/`, `multi-faith/`

**Done when:** `npm run start:dev` starts on port 3001; `GET /health` returns `{"status":"ok","db":"ok","redis":"ok"|"disabled"}`; all endpoints return 401 without auth; `DEV_AUTH_BYPASS=true` + `x-dev-user` header allows local requests; `POST /intake/:slug` creates case + contact + tasks in one transaction.

**Key decisions locked in build plan:**
- `pdfkit` (not puppeteer — too heavy for Fargate; not @react-pdf/renderer — requires React DOM in Node)
- `N8nService` uses `HttpService` from `@nestjs/axios` — not raw axios — for testability
- `jobs/` module does NOT exist — replaced entirely by `n8n/`
- Swagger returns 404 in production — never exposed
- CORS: credentialed + specific origins for dashboard API; wildcard `*` on `/intake` route only (no cookies on intake)

---

### Phase 6 — Next.js Frontend Scaffold
**Wave:** 5 *(runs in parallel with Phase 7)*

**Goal:** Full Next.js 14 App Router application with all routes implemented against the local API. Auth flow, case dashboard, case workspace with all tabs, and public routes working. Phase 2/3 routes exist as stubs only.

**Requirements covered:** All frontend-facing requirements (CASE, INTK, TASK, OBIT, DOCS, PAY, SIGN, GPL, VEND, CAL, SETT)

**Plans:**
1. App bootstrap — `create-next-app` (TypeScript, App Router, Tailwind), shadcn/ui init, `middleware.ts` (auth guard on `(dashboard)` routes + tenant slug extraction from subdomain), Amplify config in `src/lib/auth/amplify-config.ts` imported in root `layout.tsx`
2. Auth flow — login page, `auth.store.ts` (Zustand: user + tenantId + tokens), `src/lib/api/client.ts` (axios interceptor: injects `x-dev-user` + `Authorization: Bearer dev-bypass-token` when `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`)
3. Day 10 MVP pages — case dashboard (`DataTable`: status, assigned, overdue columns), case workspace (tabbed shell), `app/intake/[tenantSlug]/page.tsx` (public, mobile-first), task checklist component
4. Full Phase 1 pages — all workspace tabs (documents, payments, signatures, vendors, calendar), `price-list/page.tsx`, `vendors/page.tsx`, all settings pages (branding, staff, templates)
5. Public routes + PWA stub — `app/sign/[token]/page.tsx`, `app/memorial/[caseId]/page.tsx` (Phase 2 TODO stub), `public/manifest.json`, `public/sw.js` (non-functional shell), `<PwaRegister />` client component (`NEXT_PUBLIC_ENABLE_PWA=false` by default), PWA meta tags in root `layout.tsx`; Phase 3 route stubs: `analytics/`, `multi-location/`, `settings/faith-traditions/`
6. Mobile-responsive pass — `sm:`/`md:`/`lg:` prefixes throughout; sidebar collapses below `md:`; DataTables `overflow-x-auto`; full-width inputs on mobile

**Done when:** `npm run dev` starts on port 3000; login renders; dashboard loads cases from API with `DEV_AUTH_BYPASS=true`; intake form submits and new case appears in dashboard; `npx tsc --noEmit` passes.

---

### Phase 7 — CDK Project Init
**Wave:** 5b *(runs in parallel with Phase 6)*

**Goal:** `infrastructure/` CDK TypeScript project initialized. All 7 stack files exist as stubs. `npx cdk synth` runs without errors.

**Requirements covered:** INFR-01 (prerequisite for Phase 8)

**Plans:**
1. CDK init — `mkdir infrastructure && cd infrastructure && npx aws-cdk init app --language=typescript && npm install`
2. Stack stubs — create 7 empty stack files: `foundation-stack.ts`, `network-stack.ts`, `auth-stack.ts`, `data-stack.ts`, `compute-stack.ts`, `amplify-stack.ts`, `observability-stack.ts`
3. Root scripts — add `"infra:synth"` and `"infra:deploy"` to root `package.json`

**Done when:** `npx cdk synth` runs without errors; `npx tsc --noEmit` passes in `infrastructure/`.

---

### Phase 8 — AWS CDK Infrastructure Deployment
**Wave:** 6

**Goal:** All 7 CDK stacks fully implemented, synthesized, and deployed. Backend at `api.vigilhq.com/health`. Frontend at `app.vigilhq.com`. Cognito User Pool live. RDS + Redis in isolated subnets.

**Requirements covered:** INFR-01–06, INFR-08

**Plans:**
1. Foundation + Network stacks — Route53 hosted zone, ACM wildcard cert (DNS validation auto-blocks 5-30 min — expected), SES domain + DKIM; VPC (10.0.0.0/16, 2 AZs, **public + isolated subnets only — no NAT Gateway**), IGW, S3 Gateway endpoint (free), 4 security groups (sg-alb: 80/443 from 0.0.0.0/0; sg-ecs: 3001 from sg-alb only; sg-rds: 5432 from sg-ecs; sg-redis: 6379 from sg-ecs)
2. Auth stack — Cognito User Pool (`selfSignUpEnabled: false`, `custom:tenantId` + `custom:role` attributes, `removalPolicy: RETAIN`), App Client (`USER_PASSWORD_AUTH` + `REFRESH_TOKEN`, 15-min access token, 30-day refresh, `enableTokenRevocation: true`)
3. Data stack — RDS PostgreSQL 16 (db.t4g.micro, Performance Insights 7-day free, isolated subnet), ElastiCache Redis (cache.t4g.micro, isolated subnet — **omit early stage**, add when scaling to 2+ containers), 2 S3 buckets (Glacier lifecycle after 90 days), 5 Secrets Manager secrets — all `removalPolicy: RETAIN`
4. Compute stack — ECR repo, ECS Fargate (512 CPU/1024MB, **public subnet**, `assignPublicIp: true`, min 1 task early stage / max 10), ALB + HTTPS listener, Route53 A record `api.vigilhq.com`, Fargate Spot capacity provider for non-critical tasks, `vigil-migrations` task definition (runs `prisma migrate deploy` before ECS service update), GitHub Actions OIDC (no long-lived AWS keys in GitHub secrets), 5 IAM roles
5. Amplify + Observability stacks — Amplify Hosting (GitHub `main` → `app.vigilhq.com`, wildcard `*.vigilhq.com`), CloudWatch log groups + 6 alarms + SNS → email, Sentry DSN in Secrets Manager; BetterUptime configured manually post-deploy (not CDK — monitor `/health` at 1-min interval)

**Done when:** `npx cdk deploy --all` completes; `curl https://api.vigilhq.com/health` returns `{"status":"ok"}`; `https://app.vigilhq.com` loads; Cognito User Pool ID visible in AWS Console.

**Critical gotchas (from build plan):**
- `removalPolicy: RETAIN` on ALL stateful resources — never `DESTROY`
- SES starts in sandbox — README must note: request production access manually
- Route53 NS records must be copied to domain registrar after `VigilFoundation` stack deploys
- GitHub OIDC: add `token.actions.githubusercontent.com` as OIDC provider in IAM — no long-lived keys

---

### Phase 9 — n8n Automation Workflows
**Wave:** 7

**Goal:** All 6 n8n workflows created and activated in `rashadbarnett.app.n8n.cloud`. Real webhook URLs in `.env` + Secrets Manager. `N8nService` logs no `[PLACEHOLDER]` warnings on start.

**Requirements covered:** FLWP-01–03, VEND-03, REVW-01–02, data retention

**Plans:**
1. Workflow 1 — Grief Follow-Up Scheduler: webhook (case `completed`) → Wait 7d → SES 1-week email → Wait 23d → SES 1-month → Wait 5mo → SES 6-month → Wait 6mo → SES 1-year; update `FollowUp.status = 'sent'` via NestJS internal callback after each send
2. Workflow 2 — Staff Notification Hub: webhook → route by `eventType` → SES email + SNS SMS for new case assigned, overdue task (daily 8am CRON), vendor confirmation
3. Workflow 3 — Intake Notification: webhook (intake submitted) → immediate SES notify to assigned staff with case deep link
4. Workflow 4 — Document Generation: webhook (case completed) → `POST /internal/documents/generate-service-program/:caseId` (protected by `@InternalOnly()` shared secret header)
5. Workflow 5 — Data Retention Cleanup: monthly CRON (1st, 2am) → `GET /internal/cases/pending-hard-delete` → permanently delete records where `deletedAt < now() - 7 years`
6. Workflow 6 — Review Request: scheduled 14 days after `case.completedAt` → SMS + email Google review request using `tenant.googleReviewUrl`

**Done when:** All 6 workflows Active in n8n dashboard; test webhook triggers return 200; N8nService no longer logs `[PLACEHOLDER]` on backend start; `CronStubsService` disabled.

---

### Phase 10 — Testing Suite
**Wave:** 8

**Goal:** Full 5-layer test suite. `npm run test` passes with ≥80% coverage on business logic. Playwright E2E covers all critical user journeys. All tests runnable in CI.

**Requirements covered:** TEST-01–06

**Plans:**
1. Jest config + mocks — `jest.config.ts` (separate backend/frontend projects), `__mocks__/` for `next/link`, `next/image`, `next/navigation`
2. Unit tests — `ForTenantExtension` (tenant isolation enforced at ORM level), `TaskTemplatesService` (correct tasks per service type), `PdfService` (`generateGpl` returns Buffer), `EmailService` (Resend↔SES switching via env var), `CognitoAuthGuard` (bypass mode injects mock user from header)
3. Contract tests (`@jest-environment node`) — `POST /intake/:slug` (case + contact + tasks created atomically), `GET /cases` (returns only requesting tenant's cases), `POST /auth/login`, `GET /health` (Redis disabled → `'disabled'` not error)
4. Component tests (RTL) — case dashboard DataTable (renders, filters work), intake form (submits + shows confirmation), signature capture (renders on mobile viewport)
5. Acceptance test — full flow: intake form → case in dashboard → task checklist visible → mark task complete
6. Tenant isolation test — seed 2 tenants, authenticate as Tenant A, assert `GET /cases` + `GET /documents` + `GET /contacts` return zero Tenant B records
7. Playwright E2E — login → dashboard (`DEV_AUTH_BYPASS`), intake → case created, case workspace tab navigation, sign page renders token

**Done when:** `npm run test` passes; ≥80% coverage on `tasks/`, `cases/`, `auth/` services; tenant isolation test green; `npm run test:e2e` completes all Playwright specs.

---

### Phase 11 — Seed Data & Demo Environment
**Wave:** 9

**Goal:** `prisma/seed.ts` creates a complete demo environment matching the 15-minute demo script. Single-command local dev setup. Login with demo credentials shows 3 cases immediately.

**Requirements covered:** SEED-01–04

**Plans:**
1. Tenants + users — Sunrise Funeral Home (Standard plan, `sunrise` slug) + Heritage Memorial (Pilot plan, `heritage` slug); director + staff user per tenant; Cognito users via `AdminCreateUserCommand` when AWS creds present; stub `cognitoSub` values (`dev-stub-${email}`) used offline
2. Price list + task templates — Sunrise price list (professional services, facilities, vehicles, merchandise); task templates for all 4 service types (burial: 12 tasks, cremation: 8, graveside: 6, memorial: 5)
3. Demo cases — 3 Sunrise cases: `new` (just submitted, no tasks started), `in_progress` (3/8 tasks done, 1 overdue), `completed` (service done, follow-up scheduled, signed docs present)
4. Supporting demo data — 4 vendors (florist, clergy, livery, crematory), 3 calendar events (visitation + service + committal), payment records, 1 signed authorization (base64 stub), obituary draft, follow-up schedule entries
5. One-command dev setup — `docker-compose up -d && npx prisma migrate dev && npx prisma db seed`; README documents exact steps with `DEV_AUTH_BYPASS=true` + `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`

**Done when:** `npx prisma db seed` completes without errors; login as `director@sunrise.demo` / `Demo1234!` shows dashboard with 3 cases; 15-minute demo script runnable end-to-end.

---

## Execution Notes

**Phases 6 and 7 run in parallel** — Next.js scaffold and CDK project init are fully independent. Start both simultaneously.

**Day 10 demo checkpoint** — after Phase 5 partial (auth + cases + contacts + tasks + intake done) and Phase 6 partial (login + dashboard + workspace + intake pages done):
Login → case dashboard → case workspace → task checklist → intake form. 4 screens end-to-end. Enough for first client demo.

**Hard gates — do NOT skip:**
```
Phase 3 before Phase 4    (NestJS imports shared-types)
Phase 4 before Phase 5    (services import Prisma client)
Phase 5 before Phase 6    (frontend calls real API)
Phase 7 before Phase 8    (CDK project must exist to implement stacks)
Phase 5 before Phase 10   (tests need real modules)
Phase 8 before Phase 9    (n8n needs deployed API URL for webhooks)
```

| Phase | Wave | Done when... |
|---|---|---|
| 1 | 0 | `aws sts get-caller-identity` returns account |
| 2 | 1 | `docker-compose up` starts; `.env.example` files exist |
| 3 | 2 | `npx tsc --noEmit` passes in shared-types |
| 4 | 3 | `npx prisma migrate dev` applies without errors |
| 5 | 4 | `GET /health` 200; intake POST creates case atomically |
| 6 | 5 | `npm run dev` starts; dashboard loads from API |
| 7 | 5b | `npx cdk synth` runs without errors |
| 8 | 6 | `curl https://api.vigilhq.com/health` returns ok |
| 9 | 7 | All 6 n8n workflows Active; no placeholder warnings |
| 10 | 8 | `npm run test` ≥80% coverage; E2E specs pass |
| 11 | 9 | `npx prisma db seed` works; demo script runnable |

---

## Milestone Summary

**M1 Goal:** Fully scaffolded, demo-able, AWS-deployed platform. All Phase 1 features implemented. Seed data loaded. 15-minute demo script runnable end-to-end. Ready to sell.

**Revenue target after M1:** First pilot client at $1,500 setup. Standard pricing ($6K–$8K setup + $500–$700/mo) after 2 case studies.

**Infrastructure cost:** ~$40/mo early stage (0–3 clients) → ~$89/mo at 5+ clients.

---
*Roadmap created: 2026-04-05*
*Regenerated: 2026-04-05 from vigil-build-plan.md waves 0–9*
