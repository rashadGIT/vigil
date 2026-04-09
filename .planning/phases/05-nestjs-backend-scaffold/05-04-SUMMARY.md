---
phase: 05-nestjs-backend-scaffold
plan: 04
subsystem: backend
tags: [nestjs, documents, s3, pdf, payments, obituaries, price-list, signatures, esign, ueta, compliance]
dependency_graph:
  requires: [05-03, 04-prisma-schema]
  provides: [documents-module, payments-module, obituaries-module, price-list-module, signatures-module, s3-presign-flow, gpl-pdf, esign-audit-trail]
  affects:
    - backend/prisma/schema.prisma
    - backend/prisma/migrations/
    - backend/src/modules/documents/
    - backend/src/modules/payments/
    - backend/src/modules/obituaries/
    - backend/src/modules/price-list/
    - backend/src/modules/signatures/
    - backend/src/app.module.ts
tech_stack:
  added:
    - "@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner — presigned PUT/GET URLs (already in package.json)"
    - "pdfkit 0.18.0 — GPL + service program PDF generation (already in package.json)"
  patterns:
    - "S3 presign flow: POST /presign → client PUT to S3 → POST /confirm flips uploaded=true (T-05-16)"
    - "PdfService.renderToBuffer(): pdfkit stream piped to Buffer.concat — no filesystem writes (D-20)"
    - "TOKEN_LIFETIME_MS = 72h; randomBytes(32).toString('base64url') — 256-bit entropy token"
    - "checkboxConfirmedAt gate: sign() throws BadRequestException if null — ESIGN/UETA compliance (SIGN-03)"
    - "Public sign endpoints: @Public() + @Throttle({ limit: 5-20, ttl: 60_000 }) — token is authorization (T-05-18)"
    - "Explicit AuditLog.create() in sign() — public endpoint, AuditLogInterceptor can't infer user (SIGN-03)"
    - "Explicit tenantId in all create() data alongside forTenant() — Prisma type system requirement"
key_files:
  created:
    - backend/prisma/migrations/20260409000001_add_upload_confirm_fields/migration.sql
    - backend/src/modules/documents/s3.service.ts
    - backend/src/modules/documents/pdf.service.ts
    - backend/src/modules/documents/documents.service.ts
    - backend/src/modules/documents/documents.controller.ts
    - backend/src/modules/documents/documents.module.ts
    - backend/src/modules/documents/dto/presign.dto.ts
    - backend/src/modules/documents/dto/confirm.dto.ts
    - backend/src/modules/payments/dto/upsert-payment.dto.ts
    - backend/src/modules/payments/payments.service.ts
    - backend/src/modules/payments/payments.controller.ts
    - backend/src/modules/payments/payments.module.ts
    - backend/src/modules/obituaries/obituaries.service.ts
    - backend/src/modules/obituaries/obituaries.controller.ts
    - backend/src/modules/obituaries/obituaries.module.ts
    - backend/src/modules/price-list/dto/price-list-item.dto.ts
    - backend/src/modules/price-list/price-list.service.ts
    - backend/src/modules/price-list/price-list.controller.ts
    - backend/src/modules/price-list/price-list.module.ts
    - backend/src/modules/signatures/dto/request-signature.dto.ts
    - backend/src/modules/signatures/dto/sign.dto.ts
    - backend/src/modules/signatures/signatures.service.ts
    - backend/src/modules/signatures/signatures.controller.ts
    - backend/src/modules/signatures/signatures.module.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/src/app.module.ts
decisions:
  - "Document confirm flow uses two-step (presign → client PUT → confirm callback) rather than server-side proxy — avoids double-bandwidth and keeps S3 URL lifetime short (T-05-16)"
  - "Public sign endpoints use bare prisma (not forTenant) — token is the authorization; no authenticated tenant context available"
  - "Explicit AuditLog.create() in SignaturesService.sign() — AuditLogInterceptor cannot write audit records for unauthenticated requests (SIGN-03 compliance)"
  - "Migration SQL created manually (no live DB in CI worktree) — matches schema changes exactly; will be applied on next docker-compose up + prisma migrate deploy"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-09"
  tasks_completed: 9
  files_changed: 26
---

# Phase 05 Plan 04: Document + Compliance Modules Summary

**One-liner:** Five compliance modules (documents/S3-presign, payments, obituaries, price-list/GPL, signatures/ESIGN-UETA) with schema patch for upload confirm flow and ESIGN intent capture, all wired into AppModule.

## What Was Built

### Schema Patch (Task 01)

Two fields added to close gaps identified in plan research:
- `Document.uploaded Boolean @default(false)` — required for the presign confirm flow; `findByCase()` only returns `uploaded=true` docs
- `Signature.checkboxConfirmedAt DateTime?` — ESIGN/UETA requires intent timestamp stored BEFORE canvas is enabled
- `Signature.documentHash String?` — SHA-256 of signatureData for audit trail

Migration SQL in `20260409000001_add_upload_confirm_fields/migration.sql`. Prisma client regenerated.

### DocumentsModule (Tasks 02-04)

S3 client-direct upload flow with private bucket enforcement:

- `POST /cases/:caseId/documents/presign` — builds `tenantId/caseId/uuid-filename` S3 key, creates Document record with `uploaded=false`, returns `{uploadUrl, documentId, s3Key}`
- `POST /cases/:caseId/documents/confirm` — flips `uploaded=true` after client completes PUT to presigned URL (T-05-16)
- `GET /cases/:caseId/documents` — lists `uploaded=true, deletedAt=null` docs
- `GET /documents/:id/url` — returns 15-min signed GET URL (T-05-15, DOCS-02)
- `DELETE /documents/:id` — soft-delete sets `deletedAt`

`PdfService.generateGpl()` and `generateServiceProgram()` both use `renderToBuffer()` — pdfkit stream collected into `Buffer.concat(chunks)`, no filesystem writes ever (D-20).

### PaymentsModule (Task 05)

Recording-only payment tracking (no card processing):
- `PUT /cases/:caseId/payment` — upsert (create or update) payment record
- `GET /cases/:caseId/payment` — returns payment with computed `outstanding = totalAmount - amountPaid`

### ObituariesModule (Task 06)

Template-interpolated obituary draft:
- `POST /cases/:caseId/obituary/generate` — builds draft from case data (name, dob, dod, serviceType, primary family contact); upserts so re-generating is safe
- `GET /cases/:caseId/obituary` — retrieve current draft
- `PATCH /cases/:caseId/obituary` — update draftText + optional status

### PriceListModule (Task 07)

FTC GPL item management with PDF generation endpoint:
- `GET /price-list` — list active items by category + sortOrder
- `POST /price-list` (admin) — create item
- `PATCH /price-list/:id` (admin) — update item
- `POST /cases/:caseId/gpl/generate` — calls PdfService.generateGpl → S3 upload → Document record (uploaded=true)

Imports DocumentsModule for PdfService + S3Service access.

### SignaturesModule (Task 08)

ESIGN/UETA compliant signing flow:

- `POST /cases/:caseId/signatures/request` — creates 72h token (randomBytes(32), 256-bit entropy per T-05-18)
- `GET /sign/:token` (@Public, throttled 20/min) — validates token, checks expiry and already-signed (T-05-21)
- `POST /sign/:token/intent` (@Public, throttled 5/min) — stores `checkboxConfirmedAt` timestamp BEFORE canvas is shown (SIGN-03)
- `POST /sign/:token` (@Public, throttled 5/min) — requires `checkboxConfirmedAt != null`; rejects if not; captures `signerIp`, SHA-256 `documentHash`; writes explicit `AuditLog` record (T-05-17)

All public endpoints use `@Public()` so `CognitoAuthGuard` skips them — token is the authorization.

### AppModule Wiring (Task 09)

All five modules registered after IntakeModule in the imports array.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added explicit tenantId in all create() data calls**
- **Found during:** Tasks 04-08
- **Issue:** `forTenant()` extension injects tenantId at runtime but Prisma TypeScript types require it at compile time in the data object
- **Fix:** Added `tenantId` to all `create()` data payloads alongside `forTenant(tenantId)` — consistent with pattern established in plan 05-03
- **Files modified:** documents.service.ts, payments.service.ts, obituaries.service.ts, price-list.service.ts, signatures.service.ts
- **Commit:** Part of each respective module commit

**2. [Rule 3 - Blocking] Manual migration SQL file created**
- **Found during:** Task 01
- **Issue:** `prisma migrate dev` requires a live DATABASE_URL — no DB running in the parallel worktree execution environment
- **Fix:** Created migration SQL manually at `20260409000001_add_upload_confirm_fields/migration.sql` with the exact DDL changes. Prisma `generate` ran successfully with DATABASE_URL=placeholder. Migration will apply on next `docker-compose up && prisma migrate deploy`
- **Files modified:** backend/prisma/migrations/20260409000001_add_upload_confirm_fields/migration.sql
- **Commit:** 2e1aab6

## Known Stubs

None — all modules have real implementations. PdfService has functional pdfkit rendering, S3Service has real AWS SDK calls, SignaturesService has real token generation and ESIGN logic.

## Threat Flags

All threat model items from the plan were mitigated:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-05-15 | `expiresIn: 900` on both GET and PUT presigned URLs |
| T-05-16 | `confirmUpload()` flips `uploaded=true` only after client callback |
| T-05-17 | `signerIp + documentHash + checkboxConfirmedAt + explicit AuditLog.create()` in sign() |
| T-05-18 | 32-byte random token + `@Throttle({ limit: 20, ttl: 60_000 })` on GET /sign/:token |
| T-05-19 | `sign()` throws `BadRequestException` if `sig.checkboxConfirmedAt` is null |
| T-05-21 | `expiresAt.getTime() < Date.now()` check in `findByToken()` |

## Self-Check: PASSED

All 26 files verified present. All 9 commits verified. Schema fields, expiresIn values, TOKEN_LIFETIME_MS, checkboxConfirmedAt gate, @Public() decorators, and filesystem-write absence all confirmed.
