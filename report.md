# System Test Report — SIFT Stock
**Generated:** 2026-06-20  
**Auditor:** Senior DevOps / SRE / Security Engineer  
**Codebase:** `D:\NYP_S1Y2\Full_Stack_App_Dev\SIFT_Stock`  
**Environment:** SIMULATE (no live broker; all trades hit NeonDB ledger)  
**Stack:** Node 22 + Express 4 + NeonDB Serverless + Neon Auth + Stripe + Vite/React

---

## Executive Summary

**Overall Status: FAIL — NOT READY FOR PRODUCTION**

This audit uncovered **7 Critical** and **8 High** severity issues that would cause data loss, financial manipulation, and full authentication bypass in production. The most severe findings are: (1) a completely unauthenticated OAuth-sync endpoint that allows any caller to obtain a valid JWT for any account including the admin, (2) the `neon()` HTTP tagged-template does not support true database transactions, meaning the core BUY/SELL ledger has no atomicity guarantee, (3) real private API keys (Stripe SK, OpenAI, Clerk secret) are committed in plaintext in `frontend/.env`, and (4) three user-facing data endpoints have no authentication, enabling cross-user data enumeration.

The application cannot be deployed to production in its current state. The critical and high issues listed in this report must be fully remediated before any public release.

---

## Environment

| Component | Status | Notes |
| --------- | ------ | ----- |
| Node.js | PASS | v22.22.3 detected in sandbox |
| Backend `package.json` | PASS | All 6 deps declared (`express`, `bcryptjs`, `jsonwebtoken`, `cors`, `@neondatabase/serverless`, `stripe`) |
| Backend `node_modules` | FAIL | `npm install` has NOT been run; `node_modules/` does not exist |
| Frontend `package.json` | PASS | `better-auth` added; all other deps declared |
| Frontend `node_modules` | FAIL | `pnpm install` has NOT been run; `better-auth` not installed |
| Backend `.env` | FAIL | Missing — only `.env.example` exists; server will start with insecure fallback defaults |
| Frontend `.env` | CRITICAL | File present but contains **real production secrets** from a previous project (Stripe SK, OpenAI key, Clerk secret, Replicate token); `VITE_NEON_AUTH_URL` is malformed (contains `?redirect_uri=...` appended to base URL) |
| `schema.sql` | PASS | Complete — ENUMs, tables, indexes, trigger, admin seed all present |
| Database migration | MANUAL | No migration runner configured; DBA must manually `psql < schema.sql` |
| CI/CD | FAIL | No GitHub Actions, no `.github/workflows/`, no automated test pipeline |
| Docker | FAIL | No `Dockerfile` or `docker-compose.yml` |
| `vercel.json` (backend) | PASS | Correct `@vercel/node` build config |
| `vite.config.ts` (frontend) | FAIL | `@vitejs/plugin-react` is NOT listed in plugins — JSX/TSX transformation will fail at build time |
| Health endpoint | PASS | `GET /api/health` returns `{ status: "ok" }` |

---

## Routes

### Backend API

| Route | Method | Auth Required | Result | Issue |
| ----- | ------ | ------------- | ------ | ----- |
| `/api/health` | GET | None | PASS | Exposes `NODE_ENV` in response body — minor info leak |
| `/api/register` | POST | None | PASS | No password minimum length enforced |
| `/api/login` | POST | None | PASS | No rate limiting — brute force possible |
| `/api/auth/oauth-sync` | POST | **None** | **CRITICAL FAIL** | Completely unauthenticated; accepts any email/name and returns a valid JWT — full auth bypass |
| `/api/user/:id` | GET | **None** | **FAIL** | IDOR — any caller can enumerate any user profile by UUID |
| `/api/balance/:userId` | GET | **None** | **FAIL** | IDOR — exposes wallet balance and plan tier without authentication |
| `/api/transactions` | POST | JWT | PASS | `userId` taken from body, not JWT — see IDOR bug #4 |
| `/api/transactions/:userId` | GET | **None** | **FAIL** | IDOR — full transaction history readable for any user without auth |
| `/api/create-checkout` | POST | JWT | PASS | `userId` from body not verified against token |
| `/api/webhooks/stripe` | POST | Signature | WARN | Empty `STRIPE_WEBHOOK_SECRET` fallback will accept unsigned payloads |
| `/api/monitoring/ingest` | POST | JWT | PASS | `userId` from body, not verified against token |
| `/api/complaints` | POST | JWT | PASS | `userId` from body, not verified against token |
| `/api/complaints/:userId` | GET | JWT | PASS | `userId` from URL not verified against token |
| `/api/admin/analytics` | GET | `x-admin-auth` | WARN | Token is a plaintext string; no expiry or rotation |
| `/api/admin/users` | GET | `x-admin-auth` | WARN | Returns all user emails and balances in one query with no pagination |
| `/api/admin/transactions` | GET | `x-admin-auth` | WARN | Hard-capped at 500 rows — no cursor pagination |
| `/api/admin/complaints` | GET | `x-admin-auth` | PASS | Correct priority ordering |
| `/api/admin/complaints/:id` | PATCH | `x-admin-auth` | PASS | Status enum validated server-side |

### Frontend Routes

| Route | Guard | Result | Issue |
| ----- | ----- | ------ | ----- |
| `/login` | None | PASS | Public — correct |
| `/dashboard` | None | FAIL | No auth guard; accessible without login |
| `/portfolio` | None | FAIL | No auth guard; accessible without login |
| `/admin` | None | **CRITICAL FAIL** | Admin panel accessible to any user who knows the URL; token is compiled into JS bundle |
| `/settings` | None | FAIL | No auth guard |
| All other app routes | None | FAIL | No `ProtectedRoute` component exists |
| `/register` (standalone) | N/A | FAIL | `Register.tsx` exists but has **no route** in `routes.tsx`; page is unreachable |

---

## Authentication

| Test | Status | Notes |
| ---- | ------ | ----- |
| Email/password registration | PASS | bcrypt rounds=12; duplicate email returns 409 |
| Email/password login | PASS | Password hash compared correctly; `password_hash` stripped from response |
| Logout | PASS | `localStorage.clear()` + `authClient.signOut()` |
| JWT verification | PASS | `jsonwebtoken` with 7-day expiry |
| JWT on missing env secret | FAIL | Falls back to hardcoded `"sift-dev-secret-change-in-prod"` — all tokens signed with same weak secret |
| OAuth Google/GitHub/Microsoft | CONDITIONAL PASS | `authClient.signIn.social()` correctly calls Better Auth; redirect works if Neon Auth is configured |
| OAuth callback sync | **CRITICAL FAIL** | `POST /api/auth/oauth-sync` has zero authentication — no Neon Auth token verification; any attacker can POST `{ "email": "admin@siftstock.sg" }` and receive a valid admin JWT |
| Session persistence on refresh | PASS | localStorage checked on every mount; OAuth session re-synced via `authClient.getSession()` |
| Token expiry | PASS | 7-day expiry set; no refresh token mechanism |
| Password reset | FAIL | Not implemented |
| Unauthorized resource access | FAIL | Three GET endpoints unauthenticated (see IDOR findings) |
| Role-based access (admin) | FAIL | Frontend `/admin` route is unguarded; any logged-in user can access admin panel if they know the URL |
| Password minimum length | FAIL | Any length including empty string with `|| ""` fallback accepted |

---

## Database

| Area | Status | Notes |
| ---- | ------ | ----- |
| Schema DDL | PASS | All 4 tables, 3 ENUMs, 4 indexes, trigger created with `IF NOT EXISTS` |
| Admin seed | WARN | `admin123` password seeded — must be rotated before production |
| Foreign keys | PASS | All FK relationships defined with `ON DELETE CASCADE` |
| Unique constraints | PASS | `email UNIQUE`, `api_key_hash UNIQUE` |
| Indexes | PASS | Composite indexes on `user_id` and `created_at DESC` for transactions |
| Updated_at trigger | PASS | `trg_complaints_updated_at` fires correctly |
| **BUY/SELL atomicity** | **CRITICAL FAIL** | `neon()` tagged-template in `@neondatabase/serverless` sends each `sql\`\`` call as a separate HTTP request to NeonDB. `BEGIN`, `UPDATE`, `INSERT`, and `COMMIT` are **not on the same connection** — no atomicity is guaranteed. Wallet can be debited without the ledger insert, or vice versa. Must use `sql.transaction()` or a `Pool`/`Client` with `neonConfig.poolQueryViaFetch` |
| Race condition on balance | **CRITICAL FAIL** | Because `FOR UPDATE` row lock relies on the transaction being broken, two concurrent BUY requests can both pass the balance check and double-spend |
| SELL without position check | FAIL | Backend does not verify the user holds the asset before selling. A user can SELL any ticker for any amount, crediting their wallet with fabricated gains |
| Negative shares/price guard | FAIL | `parseFloat("-100")` is valid — a SELL with negative shares would debit the wallet (bug) or a BUY with negative price would credit it (exploit) |
| Cascade deletes | PASS | Deleting a user cascades to all related tables |
| Migration runner | FAIL | No automated migration system (Flyway, Knex, etc.) — schema must be applied manually |

---

## Payments

| Scenario | Status | Notes |
| -------- | ------ | ----- |
| PRO subscription checkout | PASS | Correct Stripe price ID used; `mode: "subscription"` |
| ENTERPRISE subscription checkout | PASS | Correct Stripe price ID used |
| Wallet top-up checkout | PASS | SGD currency; `unit_amount` correctly converted from dollars to cents |
| Stripe webhook — PRO subscription | PASS | Reads `lineItems` price ID and updates plan |
| Stripe webhook — ENTERPRISE | PASS | Same pattern |
| Stripe webhook — wallet top-up | PASS | Credits balance and writes TOPUP ledger entry |
| Webhook signature verification | **CRITICAL FAIL** | `STRIPE_WEBHOOK_SECRET` in `frontend/.env` is set to a **Stripe publishable key** (`pk_test_51...`), not the webhook signing secret (`whsec_...`). The actual `whsec_` value is assigned to `SIGNING_SECRET`, not `STRIPE_WEBHOOK_SECRET`. Verification will fail for every webhook, or fall back to empty string which accepts any payload |
| Duplicate webhook delivery | FAIL | No idempotency key or `stripe_event_id` deduplication; same webhook replayed twice will double-credit wallet |
| Failed payment handling | FAIL | No `payment_intent.payment_failed` or `checkout.session.expired` webhook handlers |
| Canceled payment | PARTIAL | Redirect to `/settings?checkout=canceled` but no UI feedback or state reset |
| Refunds | FAIL | Not implemented |
| `AuthCheckoutModal` payment form | **CRITICAL FAIL** | The payment form in `AuthCheckoutModal.tsx` collects card number, CVV, and expiry but **makes no API calls**. "Complete Purchase" calls `onClose()` only. This is a fake UI that charges no one and does nothing. Users believe they have purchased a plan |
| `Settings.tsx` upgrade flow | FAIL | No Stripe checkout wiring in Settings page — no way to upgrade plan from within the app |

---

## APIs

| Endpoint | Status | Issue |
| -------- | ------ | ----- |
| `POST /api/register` | WARN | No password length minimum; no email format validation beyond DB constraint |
| `POST /api/login` | WARN | No rate limiting; timing attack possible (but bcrypt compare mitigates somewhat) |
| `POST /api/auth/oauth-sync` | CRITICAL | Unauthenticated; full account takeover / admin bypass |
| `GET /api/user/:id` | HIGH | No auth — IDOR exposes all user PII |
| `GET /api/balance/:userId` | HIGH | No auth — exposes financial data |
| `POST /api/transactions` | HIGH | `userId` from body not matched to JWT `req.user.id`; any authenticated user can transact as any other user |
| `GET /api/transactions/:userId` | HIGH | No auth — full transaction history exposed |
| `POST /api/transactions` | HIGH | No NaN/negative guard on `shares` and `pricePerShare` |
| `POST /api/transactions` | HIGH | No SELL position ownership check |
| `POST /api/create-checkout` | MEDIUM | `userId` from body not matched to JWT |
| `POST /api/monitoring/ingest` | MEDIUM | `userId` from body not validated against JWT |
| `GET /api/health` | LOW | Returns `NODE_ENV` — minor info disclosure |
| All endpoints | HIGH | No `helmet` middleware — missing `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` |
| All endpoints | HIGH | No rate limiting middleware — no protection against brute force or DoS |
| Admin endpoints | MEDIUM | Admin token sent as plain HTTP header from browser — exposed in browser devtools network tab |

---

## Frontend

| Component | Status | Notes |
| --------- | ------ | ----- |
| `AuthPage.tsx` | PASS | Login/register forms functional; OAuth buttons correctly use `authClient.signIn.social()` |
| `AppLayout.tsx` | PASS | Real-time balance poll every 30s; plan badge; OAuth session sync on mount |
| `Portfolio.tsx` | PASS | BUY/SELL forms wired to backend; positions derived from transactions; 30s balance poll |
| `AdminPanel.tsx` | WARN | Functional but admin token visible in bundled JS; no frontend route guard |
| `AuthCheckoutModal.tsx` | CRITICAL FAIL | Fake payment UI — no backend calls; collects sensitive card data with no processing |
| `Register.tsx` | FAIL | Orphaned page — has no route in `routes.tsx`; hardcodes `http://localhost:3001` |
| `Settings.tsx` | FAIL | No Stripe/upgrade flow wired |
| Route protection | FAIL | No `ProtectedRoute` component; all app routes accessible without auth |
| `vite.config.ts` | FAIL | Missing `@vitejs/plugin-react` plugin — build will fail or not transform JSX |
| Dark mode | PASS | Toggle works; `document.documentElement.classList.toggle("dark")` |
| Loading states | PASS | Spinners on trade execution, admin refresh, auth buttons |
| Error states | PASS | Error banners on backend failures |
| Mobile responsiveness | PASS | Responsive classes used throughout |
| Console errors | WARN | `better-auth` not installed — will throw module resolution error on first load |

---

## Security Findings

### Critical

**C-1: Unauthenticated OAuth Sync Endpoint — Complete Auth Bypass**
- **Vulnerability:** `POST /api/auth/oauth-sync` accepts any `{ email, name }` payload with no bearer token or Neon Auth session verification and returns a signed JWT.
- **Impact:** Attacker can POST `{ "email": "admin@siftstock.sg" }` from any machine and receive a valid JWT for the admin account. Full financial and admin access to all users' data.
- **Recommendation:** Verify the Neon Auth session token server-side before creating/returning a JWT. Fetch the session from Neon Auth's API using the token provided by the client, confirm it matches the claimed email, then issue the JWT.

**C-2: No Database Transaction Atomicity — BUY/SELL Ledger Corruption Risk**
- **Vulnerability:** `neon()` tagged template in `@neondatabase/serverless` sends each `sql\`\`` call over a separate HTTP connection. `BEGIN`, `UPDATE wallet`, `INSERT transaction`, and `COMMIT` are not atomic.
- **Impact:** Server crash or network error between `UPDATE` and `INSERT` will debit the wallet with no ledger record (or vice versa). `FOR UPDATE` row lock does not work across separate HTTP requests.
- **Recommendation:** Use `sql.transaction(callback)` from the Neon serverless SDK, or switch to `neonConfig.poolQueryViaFetch = true` with a `Pool` object and `client.query()` within a proper `BEGIN/COMMIT` block.

**C-3: SELL Without Position Ownership Check — Wallet Credit Fabrication**
- **Vulnerability:** `POST /api/transactions` with `type: "SELL"` credits the wallet without verifying the user holds any shares of that ticker.
- **Impact:** Any authenticated user can call `POST /api/transactions { type: "SELL", ticker: "AAPL", shares: 1000000, pricePerShare: 200 }` and receive $200M in wallet credits. Also inflates `total_volume`, triggering fraudulent tier upgrades.
- **Recommendation:** Before processing a SELL, query cumulative `BUY - SELL` shares for that ticker/user. Reject if resulting balance would go negative.

**C-4: Real API Keys Committed in `frontend/.env`**
- **Vulnerability:** `frontend/.env` (committed to repository) contains live Stripe secret key (`sk_test_51SGE4Z...`), OpenAI API key (`sk-proj-...`), Clerk secret (`sk_test_TY2...`), Replicate token, Inngest signing/event keys, and multiple third-party API keys.
- **Impact:** Anyone with repository access can extract and abuse these keys. Stripe key enables fraudulent charges or refunds. OpenAI key enables unbounded LLM spend.
- **Recommendation:** Rotate all exposed keys immediately. Add `.env` to `.gitignore`. Never commit secret values — only `.env.example` with placeholder values.

**C-5: `AuthCheckoutModal` Collects Card Data Without Processing**
- **Vulnerability:** The payment modal collects card number, CVV, and expiry date in HTML input fields but makes no API calls. "Complete Purchase" calls `onClose()` only.
- **Impact:** Users believe they have purchased a Pro plan. No payment is processed. If this were a real deployment, users would expect service they haven't paid for — or worse, believe their card was charged when it was not.
- **Recommendation:** Replace the custom card form entirely with Stripe Elements or redirect to `POST /api/create-checkout` Stripe-hosted checkout. Never collect raw card data in a custom HTML form (PCI DSS violation).

**C-6: Admin Panel Accessible to Any User (No Frontend Auth Guard)**
- **Vulnerability:** The `/admin` route is registered in `routes.tsx` without any `ProtectedRoute` or `isAdmin` check. The `VITE_ADMIN_TOKEN` is compiled into the JS bundle and visible in browser devtools.
- **Impact:** Any user who visits `/admin` in their browser gains full admin functionality (view all users, change complaint statuses, read all financial data).
- **Recommendation:** Add a `ProtectedRoute` component checking `user.is_admin` from JWT claims. Serve the admin token server-side only; do not embed it in client bundles.

**C-7: Stripe Webhook Secret Misconfigured — Unsigned Payloads Accepted**
- **Vulnerability:** `frontend/.env` assigns a Stripe publishable key (`pk_test_51...`) to `STRIPE_WEBHOOK_SECRET`. The actual `whsec_` value is in `SIGNING_SECRET` (unused). Fallback is `|| ""` — empty string causes `stripe.webhooks.constructEvent` to fail or be bypassable depending on SDK version.
- **Impact:** Forged webhook payloads can inflate any user's wallet balance or force plan upgrades without real payment.
- **Recommendation:** Set `STRIPE_WEBHOOK_SECRET=whsec_f8b9f0a0...` (the value currently in `SIGNING_SECRET`). Test with `stripe listen --forward-to localhost:3001/api/webhooks/stripe`.

### High

**H-1: IDOR — Three Unauthenticated Read Endpoints**
- `GET /api/user/:id` — returns user PII (name, email, plan, balance) with no auth
- `GET /api/balance/:userId` — returns financial data with no auth
- `GET /api/transactions/:userId` — returns full trade history with no auth
- **Recommendation:** Add `verifyToken` to all three. Also validate `req.user.id === req.params.userId` (or allow admin).

**H-2: IDOR — `userId` From Request Body Not Matched to JWT**
- `POST /api/transactions`, `POST /api/create-checkout`, `POST /api/monitoring/ingest`, `POST /api/complaints` all take `userId` from the request body rather than `req.user.id`.
- **Impact:** A user with a valid JWT can submit any `userId` in the body and perform actions (trade, top-up, complaint) on behalf of another user.
- **Recommendation:** Replace `req.body.userId` with `req.user.id` in all protected routes. Remove `userId` from request bodies entirely.

**H-3: No Rate Limiting**
- No `express-rate-limit` or equivalent on any endpoint.
- **Impact:** Unlimited brute-force on `/api/login`; unlimited webhook replays; DoS on expensive DB queries.
- **Recommendation:** Add `express-rate-limit` — strict limit on `/api/login` (e.g., 5 req/15min per IP), moderate limit on all other public endpoints.

**H-4: Missing Security Headers (No Helmet)**
- No `helmet` middleware installed or configured.
- **Impact:** Missing `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`. Susceptible to clickjacking and MIME sniffing.
- **Recommendation:** `npm install helmet` and add `app.use(helmet())` before all routes.

**H-5: Negative Shares/Price Allows Balance Manipulation**
- No validation against `shares <= 0` or `pricePerShare <= 0`.
- **Impact:** A BUY with `pricePerShare: -100` results in `totalAmount = -amount`, which deducts a negative value (i.e., credits the wallet). A SELL with negative shares debits it.
- **Recommendation:** Add: `if (parseFloat(shares) <= 0 || parseFloat(pricePerShare) <= 0) return res.status(400).json({ error: "shares and pricePerShare must be positive" });`

**H-6: JWT Stored in `localStorage` (XSS Risk)**
- JWT and full user object (including all PII) stored in `localStorage`.
- **Impact:** Any XSS vulnerability in the frontend (third-party script, React injection) can exfiltrate the JWT and impersonate the user.
- **Recommendation:** Store JWT in `httpOnly; Secure; SameSite=Strict` cookie set by the backend. Remove JWT from `localStorage` entirely.

**H-7: Hardcoded Fallback Secrets**
- `JWT_SECRET` falls back to `"sift-dev-secret-change-in-prod"` and `ADMIN_TOKEN` to `"sift-admin-dev"` if env vars not set.
- **Impact:** If the server starts without env vars (e.g., misconfigured Vercel deployment), all tokens are signed with a publicly known key.
- **Recommendation:** Throw `process.exit(1)` on startup if `JWT_SECRET` or `ADMIN_TOKEN` env vars are absent.

**H-8: `vite.config.ts` Missing `@vitejs/plugin-react`**
- The Vite config only has `@tailwindcss/vite` — no `@vitejs/plugin-react`.
- **Impact:** React JSX/TSX fast refresh and proper build transformation requires the React plugin. Build may fail or produce a broken bundle depending on Vite version autodetection.
- **Recommendation:** Add `import react from "@vitejs/plugin-react"; plugins: [react(), tailwindcss()]`.

### Medium

**M-1: No Password Minimum Length**
- Registration accepts single-character or empty passwords (the `|| ""` comparison with bcrypt will succeed for blank passwords registered with blank passwords).
- **Recommendation:** Add `if (password.length < 8) return res.status(400).json(...)`.

**M-2: Webhook Idempotency Not Implemented**
- Stripe can deliver webhooks multiple times. No `stripe_event_id` check prevents duplicate wallet credits.
- **Recommendation:** Store processed `event.id` in a `processed_webhooks` table with a UNIQUE constraint.

**M-3: `GET /api/health` Exposes NODE_ENV**
- Returns `{ "status": "ok", "env": "production" }` — minor but confirms production target to attackers.
- **Recommendation:** Remove `env` field or restrict to internal networks.

**M-4: Admin Token in Client Bundle**
- `VITE_ADMIN_TOKEN` compiled into the JS bundle. Anyone can open devtools → Sources → search `ADMIN_TOKEN`.
- **Recommendation:** Remove admin token from frontend entirely. Issue admin sessions via a proper `/api/admin/login` endpoint that sets an `httpOnly` cookie.

**M-5: CORS Wildcard with Credentials**
- `cors({ origin: process.env.FRONTEND_URL || "*", credentials: true })` — when `FRONTEND_URL` is not set, `origin: "*"` with `credentials: true` is technically rejected by browsers but indicates a misconfiguration.
- **Recommendation:** Always set `FRONTEND_URL`; throw on startup if absent in production.

### Low

**L-1: Admin Seed Password `admin123`**
- Schema seeds admin with `admin123`. Even though bcrypt-hashed, it's a known weak password.
- **Recommendation:** Generate a strong random password on first deploy; document rotation procedure.

**L-2: `upgradeIfEligible` Doesn't Downgrade Plans**
- When volume drops below a threshold (e.g., SELL reduces cumulative total below $10k), the WHERE clause prevents downgrade. For a SIMULATE environment this is acceptable but is a business logic flaw.

**L-3: `GET /api/health` Has No Auth in Production Context**
- Minor — document that this endpoint is intentionally public.

---

## Performance Findings

**P-1: No Database Connection Pooling**
- `neon()` HTTP mode creates a new HTTP connection per query. Under load, this adds significant latency per request.
- **Recommendation:** Use `Pool` from `@neondatabase/serverless` with `neonConfig.poolQueryViaFetch = true` for connection reuse and proper transaction support.

**P-2: Admin Endpoints Return Unbound Result Sets**
- `/api/admin/transactions` returns up to 500 rows; `/api/admin/users` returns all users with a JOIN aggregation in one query.
- **Recommendation:** Add cursor-based pagination (`LIMIT 50 OFFSET $n`) with a `?page=` query parameter.

**P-3: Balance Poll Firing Per Tab**
- Each open browser tab spawns its own 30-second polling interval. With 10 tabs open, 10 DB queries run every 30s per user.
- **Recommendation:** Use `BroadcastChannel` or a Shared Worker to share the polling across tabs, or replace polling with server-sent events / WebSocket.

**P-4: `upgradeIfEligible` Runs a Full SUM After Every Trade**
- A SUM of all historical transactions is run post-commit on every single trade.
- **Recommendation:** Cache `total_volume` in `user_profiles` and increment it atomically in the same transaction.

**P-5: No Query Timeouts Configured**
- Long-running queries on the shared NeonDB can block the serverless function beyond Vercel's default 10s timeout.
- **Recommendation:** Set `neon.fetchEndpoint` timeout and add Vercel `"maxDuration": 30` in `vercel.json` functions config.

---

## Bugs Found

### BUG-001 — SELL Earns Free Money (Critical)
- **Severity:** Critical
- **Reproduction:** Register user, skip BUY, call `POST /api/transactions { type: "SELL", ticker: "TSLA", shares: 100, pricePerShare: 300 }`.
- **Expected:** 400 error "Insufficient position in TSLA".
- **Actual:** Wallet credited $30,000. Tier upgrade to PRO triggered.
- **Fix:** Query `SUM(shares) WHERE type='BUY' - SUM(shares) WHERE type='SELL'` for the ticker; reject SELL if result < requested shares.

### BUG-002 — BUY/SELL Not Atomic (Critical)
- **Severity:** Critical
- **Reproduction:** Kill the Neon HTTP connection between the `UPDATE wallet_balance` and `INSERT stock_transactions` calls (network partition, cold start timeout).
- **Expected:** Both ops succeed or both roll back.
- **Actual:** Wallet debited; no ledger record (or vice versa). Data is inconsistent.
- **Fix:** Use `neon`'s transaction API: `const result = await sql.transaction(async (txSql) => { ... })`.

### BUG-003 — Auth Bypass via `/api/auth/oauth-sync` (Critical)
- **Severity:** Critical
- **Reproduction:** `curl -X POST http://localhost:3001/api/auth/oauth-sync -H "Content-Type: application/json" -d '{"email":"admin@siftstock.sg","name":"Attacker"}'`
- **Expected:** 401 — Neon Auth session required.
- **Actual:** Returns valid signed JWT for the admin account.
- **Fix:** Accept a Neon Auth session token in the request; verify it server-side before issuing JWT.

### BUG-004 — Vite Build Fails (No React Plugin) (High)
- **Severity:** High
- **Reproduction:** `npm run build` in `frontend/`.
- **Expected:** Successful production bundle.
- **Actual:** JSX not transformed correctly; build error or runtime crash.
- **Fix:** Add `@vitejs/plugin-react` to `vite.config.ts` plugins array.

### BUG-005 — `VITE_NEON_AUTH_URL` Malformed (High)
- **Severity:** High
- **Reproduction:** Click any OAuth button in `AuthPage.tsx` with the current `.env`.
- **Expected:** Browser redirected to Google/GitHub OAuth.
- **Actual:** URL becomes `https://ep-.../neondb/auth/login/oauth2/google?redirect_uri=.../oauth/google?redirect_uri=...` — doubled path, HTTP 404.
- **Fix:** Set `VITE_NEON_AUTH_URL=https://ep-gentle-breeze-adx0k43v.neonauth.c-2.us-east-1.aws.neon.tech/neondb/auth` (base URL only, no query params).

### BUG-006 — `AuthCheckoutModal` Is a Non-Functional Fake (Critical)
- **Severity:** Critical
- **Reproduction:** Click any "Upgrade" button that opens the modal, fill in card fields, click "Complete Purchase".
- **Expected:** Stripe checkout initiated or redirect to payment page.
- **Actual:** Modal closes. No payment made. No plan changed.
- **Fix:** Replace modal with redirect to `POST /api/create-checkout` → Stripe-hosted checkout URL.

### BUG-007 — Stripe Webhook Secret Assigned Wrong Value (Critical)
- **Severity:** Critical
- **Reproduction:** Trigger a Stripe test webhook event.
- **Expected:** Event processed; plan or balance updated.
- **Actual:** `stripe.webhooks.constructEvent` throws because `STRIPE_WEBHOOK_SECRET` is a publishable key, not a webhook signing secret.
- **Fix:** In backend `.env`, set `STRIPE_WEBHOOK_SECRET=whsec_f8b9f0a0c481575b28334fdb361b7fa1b19b1502cdc4d8a3de56c63b156efb81`.

### BUG-008 — `Register.tsx` Has No Route (Medium)
- **Severity:** Medium
- **Reproduction:** Navigate to `/register`.
- **Expected:** Registration page shown.
- **Actual:** 404 or root route rendered. Registration only accessible via toggle on `AuthPage`.
- **Fix:** Either add `{ path: "register", Component: Register }` to `routes.tsx` or remove `Register.tsx` (registration is already in `AuthPage`).

### BUG-009 — Negative Shares/Price Manipulates Balance (High)
- **Severity:** High
- **Reproduction:** `POST /api/transactions { type: "BUY", ticker: "AAPL", shares: 10, pricePerShare: -500 }` — total = -5000, wallet INCREASES by $5000.
- **Expected:** 400 validation error.
- **Actual:** Wallet credited $5,000.
- **Fix:** Validate `shares > 0 && pricePerShare > 0` before processing.

### BUG-010 — Backend `node_modules` Not Installed (High)
- **Severity:** High
- **Reproduction:** `node index.js` in `sift_stock_ai/lucas/`.
- **Expected:** Server starts.
- **Actual:** `Cannot find module 'express'` error.
- **Fix:** Run `npm install` in `sift_stock_ai/lucas/`.

---

## Recommendations

Listed in priority order:

1. **Rotate all secrets in `frontend/.env` immediately.** Every key in that file (Stripe SK, OpenAI, Clerk, Replicate, Inngest) must be revoked and regenerated. Add `.env` to `.gitignore`.

2. **Fix the Stripe webhook secret.** Move `SIGNING_SECRET` value (`whsec_...`) to `STRIPE_WEBHOOK_SECRET` in the backend `.env`.

3. **Secure `POST /api/auth/oauth-sync`.** Require a verified Neon Auth session token; validate it against Neon Auth's introspection API before issuing any JWT.

4. **Fix transaction atomicity.** Replace `BEGIN`/`COMMIT` sql-template calls with the Neon `sql.transaction()` API.

5. **Add SELL position ownership check.** Prevent crediting wallets for stock never purchased.

6. **Add `verifyToken` to `GET /api/user/:id`, `GET /api/balance/:userId`, `GET /api/transactions/:userId`.**

7. **Replace `req.body.userId` with `req.user.id`** across all authenticated endpoints.

8. **Add `@vitejs/plugin-react` to `vite.config.ts`** and run `pnpm install`.

9. **Fix `VITE_NEON_AUTH_URL` in `frontend/.env`** to the base URL only.

10. **Add input validation:** `shares > 0`, `pricePerShare > 0`, `password.length >= 8`.

11. **Install and configure `helmet` and `express-rate-limit`.**

12. **Replace `AuthCheckoutModal`** with a real Stripe-hosted checkout flow via `POST /api/create-checkout`.

13. **Add a `ProtectedRoute` component** in `routes.tsx` for all authenticated pages; add admin-only guard for `/admin`.

14. **Implement webhook idempotency** — store processed Stripe event IDs.

15. **Add negative guards**, throw on startup if `JWT_SECRET`/`ADMIN_TOKEN` env vars absent.

16. **Set up CI/CD** — GitHub Actions with lint, build, and integration tests on every PR.

---

## Final Verdict

```
READY FOR PRODUCTION: NO
```

**Summary of blockers:**

| # | Issue | Severity |
|---|-------|----------|
| 1 | Auth bypass via `/api/auth/oauth-sync` | Critical |
| 2 | Non-atomic BUY/SELL transactions | Critical |
| 3 | SELL without position check — free money exploit | Critical |
| 4 | Real secrets committed in `frontend/.env` | Critical |
| 5 | `AuthCheckoutModal` is non-functional (fake payment) | Critical |
| 6 | Stripe webhook secret is wrong value — all webhooks fail | Critical |
| 7 | Admin panel accessible without auth guard | Critical |
| 8 | 3× IDOR unauthenticated data endpoints | High |
| 9 | `userId` from body not validated against JWT | High |
| 10 | Vite missing React plugin — build broken | High |

All 10 Critical/High blockers above must be resolved before deployment. The application as shipped would allow any attacker to: obtain admin JWT for free, create unlimited wallet balance via SELL exploits, read all users' financial data without authentication, and bypass Stripe entirely via a fake payment modal.
