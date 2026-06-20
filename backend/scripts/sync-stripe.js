"use strict";
/**
 * sync-stripe.js
 *
 * Pulls every completed Stripe checkout session and reconciles it against
 * NeonDB — credits wallet top-ups, upgrades subscription plans, and marks
 * each session processed so the webhook handler won't double-apply it.
 *
 * Usage:
 *   node -r dotenv/config scripts/sync-stripe.js          # all time
 *   node -r dotenv/config scripts/sync-stripe.js --days=7 # last 7 days
 *   node -r dotenv/config scripts/sync-stripe.js --dry-run
 */

const Stripe = require("stripe");
const { neon } = require("@neondatabase/serverless");

// ── Config ───────────────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY;
const DATABASE_URL           = process.env.DATABASE_URL;
const STRIPE_PRICE_PRO       = process.env.STRIPE_PRICE_PRO       || "price_1TZb2OLZ3OJ1F35x3wuFCALD";
const STRIPE_PRICE_ENTERPRISE= process.env.STRIPE_PRICE_ENTERPRISE|| "price_1TZb56LZ3OJ1F35x4lw1GEF1";

if (!STRIPE_SECRET_KEY) { console.error("❌  STRIPE_SECRET_KEY not set"); process.exit(1); }
if (!DATABASE_URL)       { console.error("❌  DATABASE_URL not set");       process.exit(1); }

const stripe = new Stripe(STRIPE_SECRET_KEY);
const sql    = neon(DATABASE_URL);

// ── CLI flags ────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const daysArg= args.find((a) => a.startsWith("--days="));
const days   = daysArg ? parseInt(daysArg.split("=")[1], 10) : null;

const createdFilter = days
  ? { gte: Math.floor(Date.now() / 1000) - days * 86400 }
  : undefined;

// ── Counters ─────────────────────────────────────────────────────────────────
const stats = { scanned: 0, skipped: 0, topups: 0, planUpgrades: 0, noUser: 0, errors: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAmount(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function isAlreadyProcessed(sessionId) {
  const rows = await sql`SELECT 1 FROM processed_webhooks WHERE stripe_event_id = ${sessionId}`;
  return rows.length > 0;
}

async function markProcessed(sessionId) {
  if (dryRun) return;
  await sql`
    INSERT INTO processed_webhooks (stripe_event_id)
    VALUES (${sessionId})
    ON CONFLICT DO NOTHING
  `;
}

async function applyTopup(userId, amountCents, sessionId) {
  const amount = amountCents / 100;
  if (!dryRun) {
    await sql`UPDATE user_profiles SET wallet_balance = wallet_balance + ${amount} WHERE user_id = ${userId}`;
    await sql`
      INSERT INTO stock_transactions (user_id, ticker, type, shares, price_per_share, total_amount)
      VALUES (${userId}, 'WALLET', 'TOPUP', 1, ${amount}, ${amount})
    `;
    await markProcessed(sessionId);
  }
  console.log(`  ✅  TOPUP  user=${userId}  amount=${fmtAmount(amountCents)}${dryRun ? "  [dry-run]" : ""}`);
  stats.topups++;
}

async function applyPlanUpgrade(userId, priceId, sessionId) {
  const plan = priceId === STRIPE_PRICE_PRO ? "PRO" : "ENTERPRISE";
  if (!dryRun) {
    await sql`UPDATE user_profiles SET current_plan = ${plan} WHERE user_id = ${userId}`;
    await markProcessed(sessionId);
  }
  console.log(`  ✅  PLAN   user=${userId}  plan=${plan}${dryRun ? "  [dry-run]" : ""}`);
  stats.planUpgrades++;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║        SIFT Stock — Stripe Checkout Sync         ║");
  console.log("╚══════════════════════════════════════════════════╝");
  if (dryRun)  console.log("⚠️   DRY-RUN mode — no writes to DB");
  if (days)    console.log(`📅  Fetching last ${days} day(s) only`);
  else         console.log("📅  Fetching all time");
  console.log("");

  let hasMore = true;
  let startingAfter = undefined;
  let page = 0;

  while (hasMore) {
    page++;
    const params = {
      limit: 100,
      status: "complete",
      ...(createdFilter ? { created: createdFilter } : {}),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    };

    const response = await stripe.checkout.sessions.list(params);
    const sessions = response.data;
    hasMore = response.has_more;
    if (sessions.length > 0) startingAfter = sessions[sessions.length - 1].id;

    console.log(`── Page ${page}: ${sessions.length} session(s) ─────────────────────────`);

    for (const session of sessions) {
      stats.scanned++;

      const userId = session.metadata?.userId;
      if (!userId) {
        console.log(`  ⚠️   SKIP  id=${session.id}  reason=no_user_metadata`);
        stats.noUser++;
        continue;
      }

      // Check idempotency
      const done = await isAlreadyProcessed(session.id);
      if (done) {
        console.log(`  ⏭️   SKIP  id=${session.id}  reason=already_processed`);
        stats.skipped++;
        continue;
      }

      try {
        if (session.mode === "subscription") {
          // Plan upgrade
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId   = lineItems.data?.[0]?.price?.id;
          if (priceId === STRIPE_PRICE_PRO || priceId === STRIPE_PRICE_ENTERPRISE) {
            await applyPlanUpgrade(userId, priceId, session.id);
          } else {
            console.log(`  ⚠️   SKIP  id=${session.id}  reason=unknown_price_id  price=${priceId}`);
            stats.skipped++;
          }
        } else if (session.mode === "payment" && session.amount_total) {
          // Wallet top-up
          await applyTopup(userId, session.amount_total, session.id);
        } else {
          console.log(`  ⚠️   SKIP  id=${session.id}  reason=unhandled_mode  mode=${session.mode}`);
          stats.skipped++;
        }
      } catch (err) {
        console.error(`  ❌  ERROR id=${session.id}  ${err.message}`);
        stats.errors++;
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                    SUMMARY                       ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Scanned        ${String(stats.scanned).padEnd(32)}║`);
  console.log(`║  Already done   ${String(stats.skipped).padEnd(32)}║`);
  console.log(`║  Wallet top-ups ${String(stats.topups).padEnd(32)}║`);
  console.log(`║  Plan upgrades  ${String(stats.planUpgrades).padEnd(32)}║`);
  console.log(`║  No user meta   ${String(stats.noUser).padEnd(32)}║`);
  console.log(`║  Errors         ${String(stats.errors).padEnd(32)}║`);
  if (dryRun)
  console.log("║  ⚠️  DRY-RUN — zero writes applied               ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (stats.errors > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
