# Vela — Todo List

## Rebrand: Vigil → Vela

### Prerequisites (Before Any Code Changes)
- [ ] Commission USPTO trademark clearance search on "Vela" in Classes 35 and 42
- [ ] Secure domain — check `vela.com`, `getvela.com`, `velaapp.com` availability
- [ ] File "Vela" as a trademark once clearance confirms no conflicts

### Code Changes (After Clearance)
- [x] Replace all "Vigil" references with "Vela" across the UI — page titles, nav, emails, intake forms, footer
- [x] Update domain references from `vigilhq.com` to `velaapp.com` in seed data, config, and env files
- [x] Rename app title in `package.json`, meta tags, and `<title>` tags to "Vela"
- [x] Update CDK stack names and resource tags from "vigil" to "vela"
- [ ] Update n8n workflow names and webhook URLs to reflect new brand *(manual — update in n8n cloud dashboard)*

---

## Legal & Market Risk Fixes

### E-Signature Risk (Medium — future)
- [x] Add a feature flag or abstraction layer around the e-signature integration so swapping from third-party to proprietary requires changing one file, not dozens
- [ ] Commission Freedom-to-Operate (FTO) analysis against DocuSign patent portfolio before building proprietary e-sign — budget $3,000–$8,000

### Competitive Gap — Compliance Positioning
- [x] Add FTC GPL compliance audit logging — log every time a GPL is viewed or sent to a family, creating an auditable compliance trail

### Data Privacy / ToS Risk
- [x] Add data sensitivity classification to the Prisma schema — flag fields like `causeOfDeath`, `familyFinancials`, and `decedentInfo` to exclude them from logs, exports, and non-essential queries
- [ ] Draft Terms of Service and Data Processing Agreements with an attorney before launch
