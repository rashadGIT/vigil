# Vigil

Multi-tenant SaaS for independent funeral homes. Digital intake, case management, task checklists, e-signatures, FTC GPL compliance, and automated grief follow-ups.

## Local Dev — One Command

Prerequisites: Docker, Node 20+, npm.

```bash
# 1. Start Postgres + Redis, apply migrations, seed demo data
npm run demo:reset

# 2. Backend (terminal 1)
cd backend
DEV_AUTH_BYPASS=true npm run start:dev

# 3. Frontend (terminal 2)
cd frontend
NEXT_PUBLIC_DEV_AUTH_BYPASS=true npm run dev
```

Open http://localhost:3000 and log in as `director@sunrise.demo` (any password — DEV_AUTH_BYPASS matches by email). The dashboard loads with 3 demo cases.

To re-seed without recreating the DB: `npm run demo:seed`.

Full demo script: see [`DEMO.md`](./DEMO.md).

> **Note:** `DEV_AUTH_BYPASS=true` is local dev only. The ECS task definition in production must never include this variable. `CognitoAuthGuard` logs a warning when bypass is active.

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run demo:reset` | Starts Docker containers, applies migrations, seeds demo data |
| `npm run demo:seed` | Re-seeds data only (idempotent, no DB rebuild) |
| `npm run dev` | Runs backend + frontend concurrently (requires DB already up) |
| `npm run build` | Builds all workspaces |
| `npm run test` | Runs all workspace test suites |
| `npm run test:e2e` | Runs Playwright E2E tests |
| `npm run lint` | Lints all workspaces |
| `npm run type-check` | TypeScript type check across all workspaces |

## Stack

| Layer | Choice |
|-------|--------|
| Backend | NestJS (strict mode), port 3001 |
| Frontend | Next.js 14 App Router, port 3000 |
| ORM | Prisma with `forTenant()` extension |
| DB | PostgreSQL 16 (Docker locally, RDS in prod) |
| Auth | AWS Cognito (`DEV_AUTH_BYPASS=true` for local) |
| Infrastructure | AWS CDK (7 stacks, us-east-2) |

## Monorepo Structure

```
vigil/
├── backend/          # NestJS API
├── frontend/         # Next.js 14 App Router
├── packages/
│   └── shared-types/ # @vigil/shared-types — enums + interfaces
├── infrastructure/   # AWS CDK TypeScript (7 stacks)
├── docker-compose.yml
├── DEMO.md           # 15-minute sales demo script
└── package.json      # Root workspace
```

## Environment Variables

Copy the examples and fill in values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

For local dev, the minimum required set is in each `.env.example`. Secrets in production live in AWS Secrets Manager.

## Demo

See [`DEMO.md`](./DEMO.md) for the full 15-minute sales walkthrough script.
