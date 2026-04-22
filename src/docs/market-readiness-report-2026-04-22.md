# Omuto Central — Market Readiness Audit (April 22, 2026)

## Executive Summary

**Current readiness assessment: 58 / 100 (Pilot-ready, not broad market-ready).**

The product has strong breadth (many domain modules, offline intent, PWA, AI helpers), but there are release blockers in integrations, offline sync architecture, security posture, and CI quality gates. The app is suitable for controlled pilot deployment with internal users, but not yet production-hardened for external scale.

---

## Scope & Method

This report was produced from:
- Static code and config review.
- Local quality checks (`typecheck`, `lint`, `test`, `build`, `test:e2e`).
- Database/security rules and integration flow inspection.

---

## What’s Working Well

1. **Broad product surface and role-aware workflows** across program operations, finance, HR, forms, and field data capture.
2. **Modern stack and performance baseline** (Next.js + TS + React + Firebase + PWA).
3. **Offline-first intent** exists through IndexedDB queues and sync hooks.
4. **Clear modular structure** for forms and domain-based routing.

---

## Critical Risks (Blockers)

### 1) Integration flows are currently broken by auth + payload mismatch
- Client integration hooks call `/api/sheets`, `/api/webhooks`, `/api/email` without required auth headers.
- API routes enforce `Authorization` or `X-API-Key` using `INTERNAL_API_KEY`, so browser-originated calls return 401.
- `useGoogleSheets.syncData` sends `{ action, data }`, but the POST route expects `{ type, data }` in the JSON body.

**Impact:** automations appear to run but fail in production, reducing trust and operational reliability.

### 2) Firestore rules contain an over-permissive catch-all
- Final catch-all allows authenticated users to read/write any document path.

**Impact:** role-based protections above are effectively bypassable for unlisted collections and future collections.

### 3) Offline sync server path is architecture-inconsistent
- A `'use server'` module imports browser IndexedDB helpers and online checks from a client-oriented file.
- There are two queue implementations using the same DB name but different object stores (`pending-sync` vs `offlineQueue`) at DB version `1`.

**Impact:** high risk of sync failures, missing queues, and hard-to-debug data consistency issues.

### 4) Quality gates are not healthy
- `npm run lint` fails (`next lint` script incompatible/invalid usage with this Next.js setup).
- `vitest` requires `jsdom`, but it is not installed.
- E2E fails because no production build was generated.
- Production build failed in this environment due to external Google Fonts fetch dependency.

**Impact:** no reliable pre-release signal; regression risk is high.

### 5) Runtime data seeding and hard startup failure in server admin init
- `getFirebaseAdmin()` seeds sample data at runtime if `programs` is empty.
- Missing service account throws startup-fatal error path.

**Impact:** unpredictable data lifecycle in production and fragile deployments.

---

## Database, Integrity & Broken Flow Findings

## Confirmed/likely broken flows

1. **Sheets sync (frontend → API) likely fails** due to missing auth header and POST body mismatch.
2. **Webhook/email triggers from browser likely fail** unless custom proxy/auth layer is added.
3. **Offline queue reliability risk** from dual-store same-version IndexedDB definitions.
4. **Potential permission surface expansion** from rules catch-all.

## DB/security concerns

- Firestore rules should move to explicit allowlists and schema guards, removing permissive catch-all.
- Add collection-level validators (`request.resource.data.keys()`) for critical finance/PII collections.
- Add audit collections (`audit_logs`) with append-only rules via server-side writes.

---

## Suggested Upgrades (Prioritized)

## P0 (ship before market launch)

1. **Fix integration contract and auth model**
   - Move external integrations behind server actions/route handlers only.
   - Do not expose `INTERNAL_API_KEY` to browser.
   - Standardize one request contract for each integration route and add runtime zod validation.

2. **Refactor Firestore rules**
   - Remove global `match /{document=**}` write allow.
   - Add explicit read/write per collection and role.

3. **Unify offline architecture**
   - Keep one queue implementation only.
   - Increment IndexedDB version and migration script to create all required stores safely.
   - Keep server sync logic server-only (no direct IndexedDB imports).

4. **Repair CI quality gates**
   - Update lint command for current Next.js version.
   - Install and pin `jsdom` for vitest or switch non-DOM tests to `node` env.
   - Enforce `typecheck + unit + smoke e2e` as required PR checks.

## P1 (first 2–4 weeks post-hardening)

5. **Replace runtime sample seeding with controlled migrations/seeds**
   - Use explicit `seed:dev` scripts.
   - Disable seed writes in production runtime.

6. **Observability & incident response**
   - Add structured logs + Sentry/DataDog for frontend and API.
   - Add health endpoints for Sheets/Webhooks/Email providers.

7. **Performance hardening**
   - Self-host or bundle local font fallback to remove build/runtime dependence on Google Fonts.
   - Add caching budgets and route-level performance monitoring.

## P2 (scale readiness)

8. **Multi-tenant and organization boundaries** (if commercial rollout beyond one org).
9. **RBAC admin console** for non-technical permission management.
10. **Data governance** (retention, export, deletion, consent, PII minimization).

---

## Automation Opportunities

1. **Financial workflow automation**
   - Trigger approval/rejection workflows server-side only.
   - Auto-journal to Sheets/ERP with idempotency keys.

2. **Program ops automation**
   - Scheduled reminders for missing check-ins, overdue milestones, and stale projects.
   - Auto-generate weekly summaries per program lead.

3. **Data-quality automation**
   - Nightly anomaly checks (negative totals, date inversions, duplicate beneficiaries).
   - Validation reports to admin channel.

4. **Release automation**
   - Conventional commits + semantic release + changelog generation.
   - Preview environments per PR.

---

## Synchronization Upgrades

1. **Idempotent sync protocol**
   - Every queued operation should include deterministic operation IDs.
   - Server should upsert based on operation ID to avoid duplicates on retries.

2. **Conflict handling UX**
   - Add explicit conflict state (“server changed record while offline”).
   - Offer merge/resubmit UI.

3. **Backoff + dead-letter queue**
   - Exponential retry and max-attempt dead-letter store.
   - Admin view for failed sync events.

---

## UI/UX Upgrade Recommendations

1. **Navigation simplification**
   - Current route surface is very broad; introduce role-focused home dashboards and progressive disclosure.

2. **Command palette enhancement**
   - Expand from static suggestions to contextual actions, recent entities, and keyboard-first workflows.

3. **Form experience consistency**
   - Add standardized save states (`Saving`, `Saved`, `Offline queued`, `Sync failed`).
   - Add per-field helper text and recovery for failed uploads/submissions.

4. **Trust indicators**
   - Add “Last sync”, “Data freshness”, and integration health badges in relevant modules.

---

## Go-To-Market Readiness by Area

- **Core product value:** 8/10
- **Reliability:** 4/10
- **Security/compliance posture:** 4/10
- **Integration robustness:** 4/10
- **Offline/data integrity:** 5/10
- **UX scalability:** 6/10
- **Release/ops maturity:** 4/10

**Overall:** 58/100

---

## 30/60/90 Day Execution Plan

## First 30 days (hardening)
- Fix P0 blockers.
- Turn on CI gates.
- Remove permissive DB rule.
- Stabilize build/test pipeline.

## Days 31–60 (operational scale)
- Ship observability + alerting.
- Implement idempotent sync + conflict UX.
- Add integration health dashboard.

## Days 61–90 (market launch prep)
- Security review + penetration testing.
- Data governance checklist completion.
- Pilot expansion with SLO reporting.

---

## Immediate Action Checklist

- [ ] Fix API contract/auth mismatch for sheets/webhooks/email.
- [ ] Remove permissive Firestore catch-all write rule.
- [ ] Unify offline queue architecture + migration.
- [ ] Fix lint/test/build gates and lock CI.
- [ ] Move runtime seed logic to explicit non-prod scripts.
- [ ] Add monitoring and incident playbooks.
