# Vigil — 15-Minute Demo Script

**For:** Independent funeral home owners and directors.
**Promise:** See how Vigil replaces your paper checklist, your three spreadsheets, and your missed follow-ups — in fifteen minutes.

---

## Setup (60 seconds before the call)

```bash
npm run demo:reset
# Terminal 1: cd backend && DEV_AUTH_BYPASS=true npm run start:dev
# Terminal 2: cd frontend && NEXT_PUBLIC_DEV_AUTH_BYPASS=true npm run dev
```

Open http://localhost:3000 in a private window. Log in as `director@sunrise.demo` (any password — DEV_AUTH_BYPASS matches by email).

---

## The Demo

### 0:00 — The problem (30s, no clicks)

"Every funeral director I've talked to owns the same stack: a paper checklist, a sticky note with the family's phone number, and a calendar invite they hope somebody sees. When a step slips, a family notices. We built Vigil so steps don't slip."

---

### 0:30 — Dashboard (1 min)

Click **Cases**. Three cases, three states.

- **James Holloway** — just came in through the intake form. Status: New. Zero tasks started.
- **Margaret Chen** — active arrangement. Red badge: **1 overdue task**. "That red badge is the entire product in one pixel."
- **Robert Abrams** — service completed two weeks ago. Status: Completed, all tasks done.

"Three cases, three places in the lifecycle. You can see the whole operation from this screen."

---

### 1:30 — New case from intake (2 min)

Open a new tab, go to `http://sunrise.localhost:3000/intake` (or `/intake/sunrise`). Show the mobile-first form. Fill in a test name, date of death, and family contact — submit it.

Switch back to the dashboard. The new case is already there: task checklist auto-generated, family contact linked.

"The family calls at 2am. They fill this out from bed. When you get to the office at 7, the case is already started. No phone tag, no sticky note."

---

### 3:30 — Active case: Margaret Chen (3 min)

Click into **Margaret Chen** (cremation, in progress).

- **Tasks tab:** 15 cremation-specific tasks. 3 complete. One overdue in red — due yesterday.
- Check off the overdue task. Red badge disappears from the dashboard immediately.
- **Contacts tab:** David Chen (son), primary contact. Phone and email on file, one click to call.
- **Vendors tab:** Crematory confirmed — Buckeye State Crematory. Clergy requested — Rev. Thomas Bennett still pending.
- **Obituary tab:** Auto-generated draft ready to edit and send to the family for approval.

"Every tab is a step that used to live in a different binder. Now it's all here, and the overdue badge tells you exactly which binder you dropped."

---

### 6:30 — Completed case: Robert Abrams (3 min)

Click into **Robert Abrams** (graveside, completed).

- **Tasks:** 100% complete. All 12 graveside tasks checked off.
- **Documents / Signatures:** Signed authorization from Ruth Abrams. ESIGN audit trail visible: signer name, IP address, timestamp, document hash — everything you'd need for an FTC inspection.
- **Payments:** Paid in full. $8,450. Method: check. Notes: "Paid in full at time of arrangement conference."
- **Follow-ups:** 1-week follow-up shows `sent`. 1-month, 6-month, and 1-year are scheduled automatically.

"The 1-year follow-up email sends itself next April. Ruth Abrams gets a card that feels personal. That's where referrals come from. You don't have to remember — the system does."

---

### 9:30 — FTC Price List (2 min)

Navigate to **Settings → Price List**.

Four categories: Professional Services, Facilities, Vehicles, Merchandise. Realistic FTC-typical pricing pre-loaded — Basic Services of Funeral Director at $1,995, Direct Cremation at $895.

Click **Generate GPL PDF**. PDF renders immediately. Ready to upload to your website or hand to a family.

"FTC Rule 453 requires you to have this document available on request. If you're inspected, this is the page the inspector looks at. One click."

---

### 11:30 — Multi-tenant isolation (1 min)

In the URL bar, replace `sunrise` with `heritage` — or log out and log in as `director@heritage.demo`.

Heritage dashboard: empty. Zero cases, zero vendors, zero price list.

"Every funeral home gets their own tenant. Sunrise and Heritage share nothing. This is enforced at the database layer — there's no application code you have to remember to write, and no configuration flag that can accidentally leak data."

---

### 12:30 — What happens on day two (2 min)

- **Staff invites:** Settings → Staff → Invite. New director gets an email, sets their password, and is operational in two minutes.
- **Branding:** Upload your logo, set your colors. Every PDF and every outbound email carries your brand — not ours.
- **Google review automation:** 14 days after service completion, an SMS and email go to the family with your Google review link. No follow-up required.
- **Multi-device:** The intake form is PWA-ready. Families complete it from their phone at 2am. Directors work from a tablet at the arrangement table.

---

### 14:30 — Close (30s)

"Vigil is $X/month. Setup takes one week: we import your current caseload, configure your price list, and give you a branded intake URL that lives on your existing website. Your staff is trained in an afternoon.

Next step?"

---

## Known Demo Nuances

- DEV_AUTH_BYPASS ignores passwords — that's deliberate for local demos. No Cognito required.
- Seed is idempotent: `npm run demo:seed` resets case data without dropping the database.
- Signed document hash and signature image on Robert Abrams are placeholders — the real ESIGN audit trail is captured per SIGN-03 on live signatures.
- The 1-week follow-up on Abrams shows `status: sent` but no email was actually delivered in dev (n8n is disabled offline; CronStubsService logs counts only).
- DEV_AUTH_BYPASS is local dev only. The ECS task definition in production must never include this variable.

---

## If Something Looks Off

| Symptom | Fix |
|---------|-----|
| Dashboard is empty | Run `npm run demo:seed` |
| Can't log in | Confirm both terminals have `DEV_AUTH_BYPASS=true` / `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` |
| Overdue badge not showing on Margaret Chen | Re-run `npm run demo:seed` — the overdue date is relative to seed time |
| New intake case not appearing | Check backend terminal for errors; confirm backend is on port 3001 |
| Price list empty | Run `npm run demo:seed` — price list is seeded for Sunrise only |
