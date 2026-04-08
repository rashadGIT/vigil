# Production Migration Pattern — vigil-migrations ECS Task

**Status:** Documentation only. Implemented in Phase 8 plan 08-04 (compute-stack.ts).

## Why Pre-Deploy Migration Task

- App must NEVER boot against an unmigrated schema (causes runtime errors on first query)
- Running `prisma migrate deploy` in the app's container entrypoint creates a race condition: multiple Fargate tasks could attempt migration simultaneously
- A dedicated, single-instance ECS task that runs to completion before the service updates eliminates the race

## Task Definition Pattern

Create a SECOND ECS task definition `vigil-migrations` in `infrastructure/lib/compute-stack.ts` that:

1. Shares the same container image as the main backend (built from `backend/Dockerfile`)
2. Shares the same DATABASE_URL secret from Secrets Manager (production URL must include `?sslmode=require`)
3. Overrides the container command:
   ```ts
   containerOverrides: [{
     name: 'backend',
     command: ['npx', 'prisma', 'migrate', 'deploy'],
   }]
   ```
4. Runs in the same VPC + subnets as the backend service so it can reach RDS
5. Has `cpu: 256, memoryLimitMiB: 512` (smaller than the runtime task — only needs Prisma CLI + Node)

## GitHub Actions Deploy Job (Phase 8)

The CD workflow steps in order:
1. Build + push image to ECR
2. Register new task definition revision for both `vigil-backend` and `vigil-migrations`
3. `aws ecs run-task --task-definition vigil-migrations --launch-type FARGATE ...`
4. `aws ecs wait tasks-stopped --tasks <task-arn>`
5. Check exit code: `aws ecs describe-tasks --tasks <task-arn> --query 'tasks[0].containers[0].exitCode'` — must be 0
6. ONLY THEN update vigil-backend service to use the new task definition revision

## Local Dev Equivalent

Local dev uses `npx prisma migrate dev --name <name>` against Docker Postgres. This is what plan 04-05 task 2 ran for the initial migration (`20260408032002_init`).

## Rollback Strategy

Prisma migrations are forward-only. To roll back:
1. Create a new migration that reverses the change
2. Deploy that migration through the same vigil-migrations task pattern
3. Then deploy the application code that matches the rolled-back schema

Never edit a previously-applied migration file. Never manually run SQL against production RDS.

## SSL Requirement

Production `DATABASE_URL` MUST include `?sslmode=require`:
```
postgresql://vigil_app:<secret>@vigil-prod.xxx.us-east-2.rds.amazonaws.com:5432/vigil_prod?sslmode=require
```
Local dev does NOT use SSL because the docker-compose postgres is on localhost.

## Migration File Location

All migration files live in `backend/prisma/migrations/`. Each migration is a timestamped directory:
```
backend/prisma/migrations/
  └─ 20260408032002_init/
    └─ migration.sql    ← initial DDL: 24 CREATE TABLE statements
  migration_lock.toml   ← provider lock (committed to git)
```

## Security Notes

- The DATABASE_URL secret is pulled from AWS Secrets Manager at runtime — never inlined in task definitions or GitHub Actions env vars
- The vigil-migrations task definition is destroyed after completion (one-shot run via `run-task`, not a long-running service)
- Production RDS security group allows inbound on 5432 only from the ECS task's security group
