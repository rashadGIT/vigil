# Roadmap: Vigil

## Overview

Building Vigil from an empty directory to a fully-deployed, demo-able multi-tenant SaaS platform for independent funeral homes. 11 phases map 1:1 to the waves in `vigil-build-plan.md` — read the full wave section before planning each phase, as it contains exact file structures, code patterns, and gotchas.

## Phases

- [ ] **Phase 1: AWS Account Bootstrap** - Named vigil CLI profile (us-east-2) + CDK bootstrap
- [ ] **Phase 2: Monorepo Foundation** - Root workspace, .env.example files, GitHub Actions CI/CD, Docker Compose
- [ ] **Phase 3: Shared Types Package** - All TypeScript enums and interfaces in packages/shared-types
- [ ] **Phase 4: Prisma Schema** - All tables, indexes, soft-delete fields, Phase 2/3 stubs, first migration
- [ ] **Phase 5: NestJS Backend Scaffold** - All 14+ modules implemented; Day 10 MVP modules first
- [ ] **Phase 6: Next.js Frontend Scaffold** - All routes implemented against local API (parallel with Phase 7)
- [ ] **Phase 7: CDK Project Init** - Infrastructure skeleton; all 7 stack stubs; cdk synth passes (parallel with Phase 6)
- [ ] **Phase 8: AWS CDK Infrastructure Deployment** - All 7 stacks deployed; api.vigilhq.com live
- [ ] **Phase 9: n8n Automation Workflows** - All 6 workflows active; no placeholder warnings
- [ ] **Phase 10: Testing Suite** - 5-layer test suite; 80%+ coverage; Playwright E2E passing
- [ ] **Phase 11: Seed Data & Demo Environment** - 2 tenants, 3 demo cases, 15-min demo script runnable

## Phase Details

### Phase 1: AWS Account Bootstrap
**Wave**: 0
**Goal**: AWS account accessible via named `vigil` CLI profile targeting us-east-2. CDK bootstrapped in us-east-2. Account ID 887067305712 captured for environments.ts. IAM user Macbook (AdministratorAccess) is already configured — no new IAM user needed, no installs needed.
**Depends on**: Nothing
**Requirements**: [INFR-01]
**Success Criteria** (what must be TRUE):
  1. `aws sts get-caller-identity --profile vigil` returns Account 887067305712 and Arn containing user/Macbook
  2. `aws configure get region --profile vigil` returns us-east-2
  3. CDKToolkit stack exists in us-east-2 with StackStatus CREATE_COMPLETE

**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Create named `vigil` AWS CLI profile targeting us-east-2 (reuses Macbook user key; leaves default profile at us-east-1)
- [ ] 01-02-PLAN.md — Bootstrap CDK in us-east-2 via `cdk bootstrap aws://887067305712/us-east-2 --profile vigil`; verify CDKToolkit stack is CREATE_COMPLETE

---

### Phase 2: Monorepo Foundation
**Wave**: 1
**Goal**: Monorepo skeleton with root workspace config, all .env.example files, .github/ CI/CD workflows, and Docker Compose running Postgres 16 + Redis 7 locally.
**Depends on**: Nothing (can start immediately)
**Requirements**: [INFR-07, INFR-09]
**Success Criteria** (what must be TRUE):
  1. `docker-compose up` starts Postgres + Redis without errors
  2. All 3 `.env.example` files exist (backend, frontend, infrastructure)
  3. `npx tsc --noEmit` passes at root
  4. `.github/workflows/ci.yml` and `security.yml` exist and are valid YAML

**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Root workspace: package.json (workspaces: backend, frontend, packages/*, infrastructure), tsconfig.base.json, .eslintrc.js, .prettierrc, .gitignore, .nvmrc, and stub tsconfig.json + package.json for all 4 workspaces
- [ ] 02-02-PLAN.md — .env.example files (3 total): backend (Cognito, S3, SES, n8n placeholders, DEV_AUTH_BYPASS=false, EMAIL_PROVIDER=resend), frontend (Amplify config, NEXT_PUBLIC_DEV_AUTH_BYPASS=false), infrastructure (CDK_DEFAULT_ACCOUNT=887067305712)
- [ ] 02-03-PLAN.md — GitHub Actions: ci.yml (type-check + lint + build in parallel, --if-present), security.yml (npm audit + TruffleHog PR+push), dependabot.yml (npm weekly Monday, github-actions monthly), SECURITY.md
- [ ] 02-04-PLAN.md — Docker Compose: docker-compose.yml (postgres:16-alpine port 5432 + redis:7-alpine port 6379, named volumes, healthchecks), docker-compose.test.yml (postgres:16-alpine port 5433, separate volume)
- [ ] 02-05-PLAN.md — CronStubsService stub: backend/src/common/cron/cron-stubs.service.ts (shell file only, no NestJS imports, export {} for valid tsc, Phase 5 completion instructions as comments)

---

### Phase 3: Shared Types Package
**Wave**: 2
**Goal**: packages/shared-types/ exports all TypeScript enums and interfaces mirroring the Prisma schema. Single source of truth shared by backend DTOs and frontend API clients.
**Depends on**: Phase 2
**Requirements**: []
**Success Criteria** (what must be TRUE):
  1. `npx tsc --noEmit` passes in packages/shared-types
  2. All enums importable from `@vigil/shared-types`
  3. All interfaces importable from `@vigil/shared-types`

**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Package scaffold: update package.json and tsconfig.json for no-emit type-check-only mode, create enums/ and interfaces/ directories
- [x] 03-02-PLAN.md — Enums: ServiceType, CaseStatus, UserRole, DocumentType, FollowUpTemplate, VendorType, SignatureDocument, PriceCategory, EventType, AuditAction (as const pattern)
- [x] 03-03-PLAN.md — Interfaces: ITenant, IUser, ICase, IFamilyContact, ITask, IObituary, IDocument, IPayment, IFollowUp, IVendor, ISignature, IPriceListItem, ICaseLineItem, ICalendarEvent, IAuditLog

---

### Phase 4: Prisma Schema
**Wave**: 3
**Goal**: Complete backend/prisma/schema.prisma with all Phase 1 tables, Phase 2/3 stubs, required indexes, two-stage soft delete fields (deletedAt + archivedAt), and first successful migration applied.
**Depends on**: Phase 3
**Requirements**: [AUTH-05, CASE-06]
**Success Criteria** (what must be TRUE):
  1. `npx prisma migrate dev` applies without errors
  2. `npx prisma generate` produces typed client
  3. `npx tsc --noEmit` passes in backend
  4. All 17 Phase 1 tables exist in the migration SQL
  5. Phase 2/3 stub tables (DecedentTracking, ReferralSource, FamilyPortalAccess, MemorialPage, FaithTraditionTemplate, Location, AnalyticsSnapshot) exist in schema

**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Phase 1 core tables — Tenant (feature flags + googleReviewUrl), User (cognitoSub replaces passwordHash), Case (deletedAt + archivedAt + faithTradition?), FamilyContact, Task, Obituary, Document, Payment, FollowUp
- [x] 04-02-PLAN.md — Phase 1 supporting tables — Vendor, VendorAssignment, Signature (token unique field), PriceListItem, CaseLineItem, CalendarEvent, CalendarEventStaff (join table), AuditLog
- [x] 04-03-PLAN.md — Required indexes — Case (tenantId+status, tenantId+assignedTo, tenantId+createdAt desc), Task (tenantId+completed+dueDate), FollowUp (status+scheduledAt), CalendarEvent (tenantId+startTime+endTime), AuditLog (tenantId+entityType+entityId), Signature (token)
- [x] 04-04-PLAN.md — Phase 2/3 stub tables — DecedentTracking, ReferralSource, FamilyPortalAccess, MemorialPage, FaithTraditionTemplate, Location, AnalyticsSnapshot
- [x] 04-05-PLAN.md — Migration run + ECS migration task definition stub — `npx prisma migrate dev --name init` locally; document vigil-migrations task pattern for compute-stack.ts

---

### Phase 5: NestJS Backend Scaffold
**Wave**: 4
**Goal**: Full NestJS application with all 14+ modules implemented. Day 10 MVP modules (auth, cases, contacts, tasks, intake) complete first. All Phase 1 modules complete. Phase 2/3 module stubs as empty folders only.
**Depends on**: Phase 4
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, CASE-01, CASE-02, CASE-03, CASE-04, CASE-05, CASE-06, INTK-01, INTK-02, INTK-03, TASK-01, TASK-02, TASK-03, TASK-04, OBIT-01, OBIT-02, DOCS-01, DOCS-02, DOCS-03, PAY-01, PAY-02, PAY-03, SIGN-01, SIGN-02, SIGN-03, SIGN-04, GPL-01, GPL-02, GPL-03, FLWP-01, FLWP-02, FLWP-03, FLWP-04, VEND-01, VEND-02, VEND-03, CAL-01, CAL-02, CAL-03, CAL-04, DGEN-01, DGEN-02]
**Success Criteria** (what must be TRUE):
  1. `npm run start:dev` starts on port 3001 without errors
  2. `GET /health` returns `{"status":"ok","db":"ok","redis":"ok"|"disabled"}`
  3. All endpoints return 401 without auth
  4. `DEV_AUTH_BYPASS=true` + `x-dev-user` header allows local requests
  5. `POST /intake/:slug` creates case + contact + tasks in one Prisma transaction

**Plans**: 5 plans

Plans:
- [x] 05-01: App bootstrap — nest new backend --strict, main.ts (helmet, ValidationPipe whitelist+forbidNonWhitelisted, CORS two-config, Swagger dev-only, port 3001)
- [x] 05-02: Auth + common layer — CognitoAuthGuard (DEV_AUTH_BYPASS, x-dev-user header, cognitoSub sync), auth.service.ts (InitiateAuthCommand + AdminCreateUserCommand), @InternalOnly() guard, AuditLogInterceptor, ForTenantExtension, health controller
- [x] 05-03: Day 10 MVP modules — cases/ (CRUD + status transitions), contacts/, tasks/ (CRUD + template engine + overdue detection), intake.controller.ts (Prisma transaction: case + contact + tasks + follow-ups)
- [ ] 05-04: Document + compliance modules — documents/ (S3 presigned PUT/GET), payments/, obituaries/, price-list/ (GPL CRUD + line items), signatures/ (token + ESIGN audit trail), pdf.service.ts (pdfkit generateGpl + generateServiceProgram → Buffer → S3)
- [ ] 05-05: Automation modules + stubs — vendors/, calendar/, follow-ups/, n8n/ (N8nService via HttpService, [PLACEHOLDER] warning), email/ (Resend↔SES via EMAIL_PROVIDER); Phase 2/3 empty stubs: tracking/, referrals/, family-portal/, memorial/, analytics/, multi-location/, ai-obituary/, chatbot/, multi-faith/

---

### Phase 6: Next.js Frontend Scaffold
**Wave**: 5 (parallel with Phase 7)
**Goal**: Full Next.js 14 App Router application with all routes implemented against the local API. Auth flow, case dashboard, case workspace with all tabs, and public routes working. Phase 2/3 routes exist as stubs only.
**Depends on**: Phase 5
**Requirements**: [CASE-01, CASE-02, CASE-03, CASE-04, INTK-01, INTK-03, TASK-01, TASK-02, OBIT-01, OBIT-02, DOCS-01, DOCS-02, PAY-01, PAY-02, SIGN-01, SIGN-02, GPL-01, GPL-02, VEND-01, VEND-02, CAL-01, CAL-02, SETT-01, SETT-02, SETT-03, SETT-04]
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts on port 3000 without errors
  2. Login page renders; successful auth redirects to dashboard
  3. Case dashboard loads cases from API (with DEV_AUTH_BYPASS=true)
  4. Intake form submits and new case appears in dashboard
  5. `npx tsc --noEmit` passes in frontend

**Plans**: 6 plans

Plans:
- [ ] 06-01: App bootstrap — create-next-app (TypeScript, App Router, Tailwind), shadcn/ui init, middleware.ts (auth guard + tenant slug extraction), Amplify config in src/lib/auth/amplify-config.ts
- [ ] 06-02: Auth flow — login page, auth.store.ts (Zustand: user + tenantId + tokens), client.ts (axios interceptor: DEV_AUTH_BYPASS header injection when NEXT_PUBLIC_DEV_AUTH_BYPASS=true)
- [ ] 06-03: Day 10 MVP pages — case dashboard (DataTable: status/assigned/overdue), case workspace (tabbed shell), intake form (public, mobile-first), task checklist component
- [ ] 06-04: Full Phase 1 pages — all workspace tabs (documents, payments, signatures, vendors, calendar), price-list/page.tsx, vendors/page.tsx, all settings pages (branding, staff, templates)
- [ ] 06-05: Public routes + PWA stub — sign/[token]/page.tsx, memorial/[caseId]/page.tsx (Phase 2 stub), public/manifest.json, public/sw.js (shell), PwaRegister client component (NEXT_PUBLIC_ENABLE_PWA=false default), Phase 3 route stubs (analytics/, multi-location/, settings/faith-traditions/)
- [ ] 06-06: Mobile-responsive pass — sm:/md:/lg: prefixes throughout; sidebar collapses below md:; DataTables overflow-x-auto; full-width inputs on mobile

---

### Phase 7: CDK Project Init
**Wave**: 5b (parallel with Phase 6)
**Goal**: infrastructure/ CDK TypeScript project initialized. All 7 stack files exist as stubs. npx cdk synth runs without errors. Root workspace scripts include infra:synth and infra:deploy.
**Depends on**: Phase 2
**Requirements**: [INFR-01]
**Success Criteria** (what must be TRUE):
  1. `npx cdk synth` runs without errors (empty stacks)
  2. `npx tsc --noEmit` passes in infrastructure/
  3. All 7 stack stub files exist

**Plans**: 3 plans

Plans:
- [ ] 07-01: CDK init — mkdir infrastructure && npx aws-cdk init app --language=typescript && npm install
- [ ] 07-02: Stack stubs — create 7 empty stack files: foundation-stack.ts, network-stack.ts, auth-stack.ts, data-stack.ts, compute-stack.ts, amplify-stack.ts, observability-stack.ts
- [ ] 07-03: Root scripts — add infra:synth and infra:deploy to root package.json

---

### Phase 8: AWS CDK Infrastructure Deployment
**Wave**: 6
**Goal**: All 7 CDK stacks fully implemented, synthesized, and deployed to AWS. Backend reachable at api.vigilhq.com/health. Frontend at app.vigilhq.com. Cognito User Pool live. RDS + Redis in isolated subnets.
**Depends on**: Phase 7
**Requirements**: [INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06, INFR-08]
**Success Criteria** (what must be TRUE):
  1. `npx cdk deploy --all` completes without errors
  2. `curl https://api.vigilhq.com/health` returns `{"status":"ok"}`
  3. `https://app.vigilhq.com` loads in browser
  4. Cognito User Pool ID visible in AWS Console
  5. RDS instance running in isolated subnet (no public endpoint)

**Plans**: 5 plans

Plans:
- [ ] 08-01: Foundation + Network stacks — Route53 hosted zone, ACM wildcard cert (DNS validation), SES domain + DKIM; VPC (10.0.0.0/16, 2 AZs, public + isolated subnets, NO NAT Gateway), IGW, S3 Gateway endpoint, 4 security groups (sg-alb/sg-ecs/sg-rds/sg-redis)
- [ ] 08-02: Auth stack — Cognito User Pool (selfSignUpEnabled: false, custom:tenantId + custom:role, RETAIN), App Client (USER_PASSWORD_AUTH + REFRESH_TOKEN, 15-min access, 30-day refresh, enableTokenRevocation)
- [ ] 08-03: Data stack — RDS PostgreSQL 16 (db.t4g.micro, Performance Insights 7-day free, isolated subnet, RETAIN), ElastiCache Redis (cache.t4g.micro, isolated subnet, omit early stage), 2 S3 buckets (Glacier lifecycle after 90 days), 5 Secrets Manager secrets
- [ ] 08-04: Compute stack — ECR repo, ECS Fargate (512 CPU/1024MB, public subnet, assignPublicIp: true, min 1/max 10), ALB + HTTPS, Route53 A record api.vigilhq.com, vigil-migrations task definition, GitHub Actions OIDC, 5 IAM roles
- [ ] 08-05: Amplify + Observability stacks — Amplify Hosting (GitHub main → app.vigilhq.com, wildcard *.vigilhq.com), CloudWatch log groups + 6 alarms + SNS → email, Sentry DSN in Secrets Manager; BetterUptime configured manually post-deploy

---

### Phase 9: n8n Automation Workflows
**Wave**: 7
**Goal**: All 6 n8n workflows created and activated in rashadbarnett.app.n8n.cloud. Real webhook URLs populated in .env and Secrets Manager. N8nService logs no [PLACEHOLDER] warnings on backend start.
**Depends on**: Phase 8
**Requirements**: [FLWP-01, FLWP-02, FLWP-03, VEND-03, REVW-01, REVW-02]
**Success Criteria** (what must be TRUE):
  1. All 6 workflows show Active status in n8n dashboard
  2. Test webhook triggers return 200
  3. N8nService logs no `[PLACEHOLDER]` warnings on backend start
  4. CronStubsService disabled (not running in local dev)

**Plans**: 6 plans

Plans:
- [ ] 09-01: Workflow 1 — Grief Follow-Up Scheduler (webhook on case completed → Wait 7d → SES 1-week → Wait 23d → 1-month → Wait 5mo → 6-month → Wait 6mo → 1-year; update FollowUp.status via internal callback)
- [ ] 09-02: Workflow 2 — Staff Notification Hub (webhook → route by eventType → SES + SNS SMS for new case, overdue task daily 8am, vendor confirmation)
- [ ] 09-03: Workflow 3 — Intake Notification (webhook on intake submitted → immediate SES notify to assigned staff with case link)
- [ ] 09-04: Workflow 4 — Document Generation (webhook on case completed → POST /internal/documents/generate-service-program/:caseId via @InternalOnly() shared secret)
- [ ] 09-05: Workflow 5 — Data Retention Cleanup (monthly CRON 1st 2am → GET /internal/cases/pending-hard-delete → hard-delete records where deletedAt < now() - 7 years)
- [ ] 09-06: Workflow 6 — Review Request (scheduled 14 days after case.completedAt → SMS + email Google review using tenant.googleReviewUrl)

---

### Phase 10: Testing Suite
**Wave**: 8
**Goal**: Full 5-layer test suite. npm run test passes with 80%+ coverage on business logic. Playwright E2E covers all critical user journeys. All tests runnable in CI without manual setup.
**Depends on**: Phase 5
**Requirements**: [TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06]
**Success Criteria** (what must be TRUE):
  1. `npm run test` passes without errors
  2. Coverage report shows ≥80% on tasks/, cases/, auth/ service files
  3. Tenant isolation test is green (Tenant A cannot read Tenant B data)
  4. `npm run test:e2e` completes all Playwright specs without failures

**Plans**: 7 plans

Plans:
- [ ] 10-01: Jest config + mocks — jest.config.ts (separate backend/frontend projects), __mocks__/ for next/link, next/image, next/navigation
- [ ] 10-02: Unit tests — ForTenantExtension (tenant isolation at ORM), TaskTemplatesService (correct tasks per service type), PdfService (generateGpl returns Buffer), EmailService (Resend↔SES switching), CognitoAuthGuard (bypass injects mock user)
- [ ] 10-03: Contract tests (@jest-environment node) — POST /intake/:slug (atomic create), GET /cases (tenant scoped), POST /auth/login, GET /health (Redis disabled → 'disabled')
- [ ] 10-04: Component tests (RTL) — case dashboard DataTable, intake form submission, signature capture on mobile viewport
- [ ] 10-05: Acceptance test — full flow: intake form → case in dashboard → task checklist visible → mark task complete
- [ ] 10-06: Tenant isolation test — seed 2 tenants, auth as Tenant A, assert GET /cases + /documents + /contacts return zero Tenant B records
- [ ] 10-07: Playwright E2E — login → dashboard (DEV_AUTH_BYPASS), intake → case created, case workspace tab navigation, sign page renders

---

### Phase 11: Seed Data & Demo Environment
**Wave**: 9
**Goal**: prisma/seed.ts creates a complete demo environment matching the 15-minute demo script. Single-command local dev setup. Login with demo credentials shows 3 cases immediately.
**Depends on**: Phase 5
**Requirements**: [SEED-01, SEED-02, SEED-03, SEED-04]
**Success Criteria** (what must be TRUE):
  1. `npx prisma db seed` completes without errors
  2. Login as `director@sunrise.demo` / `Demo1234!` with DEV_AUTH_BYPASS shows dashboard with 3 cases
  3. Cases are in different states: new, in_progress (1 overdue task), completed
  4. 15-minute demo script is runnable end-to-end without errors

**Plans**: 5 plans

Plans:
- [ ] 11-01: Tenants + users — Sunrise Funeral Home (Standard, sunrise slug) + Heritage Memorial (Pilot, heritage slug); director + staff per tenant; Cognito users via AdminCreateUserCommand when creds present; stub cognitoSub offline
- [ ] 11-02: Price list + task templates — Sunrise price list (4 categories); task templates for all 4 service types (burial: 12, cremation: 8, graveside: 6, memorial: 5)
- [ ] 11-03: Demo cases — new (just submitted), in_progress (3/8 tasks done, 1 overdue), completed (signed docs, follow-up scheduled)
- [ ] 11-04: Supporting demo data — 4 vendors, 3 calendar events, payment records, 1 signed authorization stub, obituary draft, follow-up schedule entries
- [ ] 11-05: One-command dev setup — docker-compose up -d && npx prisma migrate dev && npx prisma db seed; README with DEV_AUTH_BYPASS=true steps

## Progress

**Execution order:** Phases 6 and 7 run in parallel. All others sequential.

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 1. AWS Account Bootstrap | 2/2 | Complete | 2026-04-05 |
| 2. Monorepo Foundation | 5/5 | Complete | 2026-04-06 |
| 3. Shared Types Package | 0/3 | Planned | - |
| 4. Prisma Schema | 0/5 | Not started | - |
| 5. NestJS Backend Scaffold | 0/5 | Not started | - |
| 6. Next.js Frontend Scaffold | 0/6 | Not started | - |
| 7. CDK Project Init | 0/3 | Not started | - |
| 8. AWS CDK Infrastructure Deployment | 0/5 | Not started | - |
| 9. n8n Automation Workflows | 0/6 | Not started | - |
| 10. Testing Suite | 0/7 | Not started | - |
| 11. Seed Data & Demo Environment | 0/5 | Not started | - |
