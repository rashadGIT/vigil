---
phase: 11
slug: seed-data-demo-environment
status: secured
threats_open: 0
threats_total: 15
threats_closed: 15
asvs_level: 1
audited: 2026-04-14
---

# Phase 11 Security Review — Seed Data & Demo Environment

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|----------|
| T-11-01 | Information Disclosure | Hardcoded `Demo1234!` password in seed.ts | accept | CLOSED | Demo-only credentials; `.demo` email domain; local-dev-only policy documented |
| T-11-02 | Spoofing | Stub cognitoSub values | mitigate | CLOSED | `seed.ts:31` — prefix `cognito-sub-` is non-UUID; cannot collide with real Cognito subs |
| T-11-03 | Tampering | Seed running against prod DB | mitigate | CLOSED | `DEMO.md:119`, `README.md:29` — local-dev-only documented; upserts keyed on demo slugs only |
| T-11-04 | Elevation of Privilege | Demo admin user in prod Cognito | accept | CLOSED | Only created when env vars explicitly set; deployment checklist excludes seed from prod |
| T-11-05 | Tampering | Second-run seed overwrites admin price edits | accept | CLOSED | Uses `findFirst` match on `(tenantId, category, name)` — preserves IDs and linked CaseLineItems |
| T-11-06 | Information Disclosure | FTC-typical prices in seed file | accept | CLOSED | GPL prices are public per FTC Rule 453; no sensitive data |
| T-11-07 | Tampering | Cross-tenant case rows (Sunrise→Heritage) | mitigate | CLOSED | `seed.ts:431` — all creates pass explicit `sunriseId`; isolation guard at `seed.ts:529-530` asserts 0 Heritage cases |
| T-11-08 | Information Disclosure | Demo PII appears real | accept | CLOSED | Fictional names (D-04); `example.com` emails (RFC 2606); 555-01xx phones (NANP fictional range) |
| T-11-09 | Spoofing | Tasks carry real director user ID | accept | CLOSED | Same user seeded in 11-01; not a real audit trail; documented in DEMO.md |
| T-11-10 | Tampering | Fake `documentHash` + `signatureData` in signature stub | accept | CLOSED | Prefixed `sha256:demo-hash-` and SVG placeholder — grep-detectable as non-production |
| T-11-11 | Information Disclosure | Signer IP 192.0.2.55 in demo signature | accept | CLOSED | `192.0.2.0/24` is TEST-NET-1 (RFC 5737) — non-routable, clearly fictional |
| T-11-12 | Tampering | Cross-tenant supporting rows | mitigate | CLOSED | All supporting seed functions pass `sunriseId` explicitly; isolation guard verifies Heritage counts = 0 |
| T-11-13 | Elevation of Privilege | DEV_AUTH_BYPASS=true in prod | mitigate | CLOSED | `DEMO.md:122` + `README.md:29` flag dev-only; `cognito-auth.guard.ts:70` emits `logger.warn` when bypass active; hard-gated on `NODE_ENV !== 'production'` |
| T-11-14 | Information Disclosure | DEMO.md reveals demo credentials | accept | CLOSED | `.demo` emails + weak password only work against locally-seeded DB; no production value |
| T-11-15 | Tampering | `demo:reset` against prod DATABASE_URL | mitigate | CLOSED | `DEMO.md:119` + `README.md:29` state local dev only; `docker-compose up -d` implies local Postgres |

## Accepted Risks Log

| Threat ID | Rationale | Accepted By |
|-----------|-----------|-------------|
| T-11-01 | Demo credentials only valid against local seeded DB | Phase 11 security review |
| T-11-04 | Seed excluded from prod deployment by policy | Phase 11 security review |
| T-11-05 | Idempotency pattern preserves linked data; documented limitation | Phase 11 security review |
| T-11-06 | FTC GPL prices are legally public information | Phase 11 security review |
| T-11-08 | All PII is fictional per RFC/NANP standards | Phase 11 security review |
| T-11-09 | Demo audit trail is acknowledged as non-production | Phase 11 security review |
| T-11-10 | Demo signature prefixed for detectability | Phase 11 security review |
| T-11-11 | TEST-NET-1 IP is non-routable by definition | Phase 11 security review |
| T-11-14 | Credentials have no production value | Phase 11 security review |

## Audit Trail

### Security Audit 2026-04-14

| Metric | Count |
|--------|-------|
| Threats registered | 15 |
| Disposition: mitigate | 6 |
| Disposition: accept | 9 |
| Verified closed | 15 |
| Open after audit | 0 |

**Fix applied during audit:** `cognito-auth.guard.ts` — added `this.logger.warn('DEV_AUTH_BYPASS active — Cognito verification skipped')` in bypass branch to satisfy T-11-13 runtime warning requirement.
