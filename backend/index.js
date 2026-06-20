"use strict";
const express    = require("express");
const { neon, neonConfig, Pool } = require("@neondatabase/serverless");
const { WebSocket } = require("ws");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const Stripe     = require("stripe");
const crypto     = require("crypto");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");

// ── Startup env validation ─────────────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET", "ADMIN_TOKEN"];
if (process.env.NODE_ENV === "production") {
  REQUIRED_ENV.push("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "FRONTEND_URL", "NEON_AUTH_URL");
}
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ── Neon setup ─────────────────────────────────────────────────────────────
// neon()    → HTTP tagged-template for simple queries (no transactions)
// Pool+ws   → WebSocket-backed pool for real atomic transactions
neonConfig.webSocketConstructor = WebSocket;
const sql  = neon(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Stripe ─────────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const STRIPE_PRICE_PRO        = process.env.STRIPE_PRICE_PRO        || "price_1TZb2OLZ3OJ1F35x3wuFCALD";
const STRIPE_PRICE_ENTERPRISE = process.env.STRIPE_PRICE_ENTERPRISE || "price_1TZb56LZ3OJ1F35x4lw1GEF1";

// ── Constants ──────────────────────────────────────────────────────────────
const JWT_SECRET    = process.env.JWT_SECRET    || "sift-dev-secret-change-in-prod";
const ADMIN_TOKEN   = process.env.ADMIN_TOKEN   || "sift-admin-dev";
const NEON_AUTH_URL        = process.env.NEON_AUTH_URL        || "";
const STACK_PROJECT_ID     = process.env.STACK_PROJECT_ID     || "";
const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY || "";
const FRONTEND_URL  = process.env.FRONTEND_URL  || "http://localhost:5173";

// ── Express app ────────────────────────────────────────────────────────────
const app = express();

// Stripe webhook needs raw body BEFORE express.json()
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS — explicit allowlist
const allowedOrigins = FRONTEND_URL.split(",").map((o) => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Rate limiting ──────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 20,
  message: { error: "Too many attempts. Try again later." },
  standardHeaders: true, legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Rate limit exceeded." },
  standardHeaders: true, legacyHeaders: false,
});
app.use("/api/login",    authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/",         generalLimiter);

// ── Auth middleware ────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(auth, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function verifyAdmin(req, res, next) {
  const token = req.headers["x-admin-auth"];
  if (!token || token !== ADMIN_TOKEN)
    return res.status(403).json({ error: "Forbidden — admin access required" });
  next();
}

// Ownership check: JWT user must match the resource userId (or be admin)
function ownsResource(paramKey = "userId") {
  return (req, res, next) => {
    const resourceId = req.params[paramKey] || req.body[paramKey];
    if (req.user.id !== resourceId && req.headers["x-admin-auth"] !== ADMIN_TOKEN) {
      return res.status(403).json({ error: "Forbidden — resource ownership mismatch" });
    }
    next();
  };
}

// ── Stack Auth / Neon Auth session verification ───────────────────────────
// Verifies an access token against Stack Auth's /api/v1/users/me endpoint.
// Returns the verified Stack user object, or throws on failure.
async function verifyStackAuthSession(accessToken) {
  if (!NEON_AUTH_URL || !STACK_PROJECT_ID || !STACK_SECRET_SERVER_KEY || !accessToken) {
    throw new Error("Stack Auth not fully configured (check NEON_AUTH_URL, STACK_PROJECT_ID, STACK_SECRET_SERVER_KEY)");
  }
  const res = await fetch(`${NEON_AUTH_URL}/api/v1/users/me`, {
    headers: {
      "x-stack-project-id":        STACK_PROJECT_ID,
      "x-stack-access-token":      accessToken,
      "x-stack-secret-server-key": STACK_SECRET_SERVER_KEY,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Stack Auth rejected token (${res.status}): ${txt}`);
  }
  return await res.json(); // { id, primary_email, display_name, profile_image_url, ... }
}

// ── Auto-tier upgrade (post-commit) ───────────────────────────────────────
async function upgradeIfEligible(userId) {
  const [vol] = await sql`
    SELECT COALESCE(SUM(total_amount), 0) AS total_volume
    FROM stock_transactions WHERE user_id = ${userId} AND type IN ('BUY','SELL')
  `;
  const volume = parseFloat(vol.total_volume);
  const plan   = volume >= 50000 ? "ENTERPRISE" : volume >= 10000 ? "PRO" : "FREE";
  // Only upgrade, never downgrade — use plan hierarchy comparison
  await sql`
    UPDATE user_profiles SET current_plan = ${plan}::plan_tier
    WHERE user_id = ${userId}
      AND (
        (${plan} = 'ENTERPRISE')
        OR (${plan} = 'PRO'        AND current_plan = 'FREE')
      )
  `;
  return plan;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH — email/password
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (password.length < 8)   return res.status(400).json({ error: "Password must be at least 8 characters" });
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    const existing = await sql`SELECT user_id FROM user_profiles WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) return res.status(409).json({ error: "Email already registered" });

    const hash        = await bcrypt.hash(password, 12);
    const displayName = name?.trim() || email.split("@")[0];
    const [user]      = await sql`
      INSERT INTO user_profiles (email, password_hash, name, wallet_balance, current_plan, is_admin)
      VALUES (${email.toLowerCase()}, ${hash}, ${displayName}, 10000.00, 'FREE', false)
      RETURNING user_id, email, name, wallet_balance, current_plan, is_admin, created_at
    `;
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ ...user, id: user.user_id, token });
  } catch (err) {
    console.error("[register]", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const [user] = await sql`SELECT * FROM user_profiles WHERE email = ${email.toLowerCase()}`;
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    const { password_hash, ...safe } = user;
    res.json({ ...safe, id: user.user_id, token });
  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── OAuth sync — verifies Stack Auth token, then issues our own JWT ──────
app.post("/api/auth/oauth-sync", async (req, res) => {
  try {
    const { accessToken, email: claimedEmail, name, image } = req.body;
    if (!accessToken) return res.status(400).json({ error: "accessToken required" });

    // Verify with Stack Auth / Neon Auth
    let stackUser;
    try {
      stackUser = await verifyStackAuthSession(accessToken);
    } catch (err) {
      return res.status(401).json({ error: "Invalid Stack Auth token: " + err.message });
    }

    // Stack Auth returns primary_email and display_name
    const email       = (stackUser?.primary_email || claimedEmail || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "Could not determine email from token" });

    const displayName = stackUser?.display_name || name || email.split("@")[0];
    const profileImg  = stackUser?.profile_image_url || image || null;

    const [user] = await sql`
      INSERT INTO user_profiles (email, name, profile_image, wallet_balance, current_plan, is_admin)
      VALUES (${email}, ${displayName}, ${profileImg}, 10000.00, 'FREE', false)
      ON CONFLICT (email) DO UPDATE
        SET name          = EXCLUDED.name,
            profile_image = COALESCE(EXCLUDED.profile_image, user_profiles.profile_image)
      RETURNING user_id, email, name, wallet_balance, current_plan, is_admin, created_at
    `;
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ ...user, id: user.user_id, token });
  } catch (err) {
    console.error("[oauth-sync]", err.message);
    res.status(500).json({ error: "OAuth sync failed" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// USER — auth required; ownership enforced
// ═══════════════════════════════════════════════════════════════════════════

app.get("/api/user/:id", verifyToken, ownsResource("id"), async (req, res) => {
  try {
    const [user] = await sql`
      SELECT user_id, email, name, wallet_balance, current_plan, is_admin, created_at
      FROM user_profiles WHERE user_id = ${req.params.id}
    `;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, id: user.user_id });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/api/balance/:userId", verifyToken, ownsResource("userId"), async (req, res) => {
  try {
    const [row] = await sql`
      SELECT wallet_balance, current_plan FROM user_profiles WHERE user_id = ${req.params.userId}
    `;
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS — atomic via Pool+ws; userId always from JWT
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/transactions", verifyToken, async (req, res) => {
  const { ticker, type, shares, pricePerShare } = req.body;
  const userId = req.user.id;   // ALWAYS from JWT, never from body

  // Input validation
  if (!["BUY", "SELL"].includes(type))
    return res.status(400).json({ error: "type must be BUY or SELL" });
  if (!ticker || !shares || !pricePerShare)
    return res.status(400).json({ error: "ticker, shares, pricePerShare required" });
  const numShares   = parseFloat(shares);
  const numPrice    = parseFloat(pricePerShare);
  if (isNaN(numShares) || numShares <= 0)
    return res.status(400).json({ error: "shares must be a positive number" });
  if (isNaN(numPrice)  || numPrice  <= 0)
    return res.status(400).json({ error: "pricePerShare must be a positive number" });

  const totalAmount = parseFloat((numShares * numPrice).toFixed(2));
  const tickerUpper = ticker.toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, 10);
  if (!tickerUpper) return res.status(400).json({ error: "Invalid ticker" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // SELL: verify ownership — user must hold enough shares
    if (type === "SELL") {
      const { rows: posRows } = await client.query(
        `SELECT COALESCE(
           SUM(CASE WHEN type='BUY' THEN shares ELSE -shares END), 0
         ) AS net_shares
         FROM stock_transactions
         WHERE user_id = $1 AND ticker = $2`,
        [userId, tickerUpper]
      );
      const netShares = parseFloat(posRows[0].net_shares);
      if (netShares < numShares) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Insufficient position. Have ${netShares.toFixed(4)} ${tickerUpper}, selling ${numShares}`,
        });
      }
    }

    // Lock user row
    const { rows: userRows } = await client.query(
      "SELECT wallet_balance FROM user_profiles WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (userRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const balance = parseFloat(userRows[0].wallet_balance);
    if (type === "BUY" && balance < totalAmount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Insufficient balance. Have $${balance.toFixed(2)}, need $${totalAmount.toFixed(2)}`,
      });
    }

    // Update balance
    if (type === "BUY") {
      await client.query(
        "UPDATE user_profiles SET wallet_balance = wallet_balance - $1 WHERE user_id = $2",
        [totalAmount, userId]
      );
    } else {
      await client.query(
        "UPDATE user_profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2",
        [totalAmount, userId]
      );
    }

    // Insert ledger record (same connection = same transaction)
    const { rows: txRows } = await client.query(
      `INSERT INTO stock_transactions (user_id, ticker, type, shares, price_per_share, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, tickerUpper, type, numShares, numPrice, totalAmount]
    );

    await client.query("COMMIT");

    // Post-commit: tier upgrade check (outside transaction is fine)
    await upgradeIfEligible(userId);
    const [updated] = await sql`SELECT wallet_balance, current_plan FROM user_profiles WHERE user_id = ${userId}`;
    res.json({ transaction: txRows[0], wallet_balance: updated.wallet_balance, current_plan: updated.current_plan });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("[transactions POST]", err.message);
    res.status(500).json({ error: "Transaction failed" });
  } finally {
    client.release();
  }
});

app.get("/api/transactions/:userId", verifyToken, ownsResource("userId"), async (req, res) => {
  try {
    const txs = await sql`
      SELECT * FROM stock_transactions WHERE user_id = ${req.params.userId}
      ORDER BY created_at DESC LIMIT 200
    `;
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STRIPE — checkout session creation + webhook handling
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/create-checkout", verifyToken, async (req, res) => {
  try {
    const { type, amount } = req.body;
    const userId = req.user.id;   // always from JWT

    let sessionConfig;
    if (type === "PRO") {
      sessionConfig = { mode: "subscription", line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }] };
    } else if (type === "ENTERPRISE") {
      sessionConfig = { mode: "subscription", line_items: [{ price: STRIPE_PRICE_ENTERPRISE, quantity: 1 }] };
    } else if (type === "TOPUP") {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 1) return res.status(400).json({ error: "Minimum top-up is $1" });
      sessionConfig = {
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "sgd",
            product_data: { name: "SIFT Wallet Top-up" },
            unit_amount: Math.round(amt * 100),
          },
          quantity: 1,
        }],
      };
    } else {
      return res.status(400).json({ error: "Invalid checkout type. Use PRO, ENTERPRISE, or TOPUP" });
    }

    const session = await stripe.checkout.sessions.create({
      ...sessionConfig,
      success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url:  `${FRONTEND_URL}/settings?checkout=canceled`,
      metadata: { userId: String(userId) },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout]", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/webhooks/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("[webhook] signature failure:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Idempotency — skip if already processed
  const already = await sql`SELECT 1 FROM processed_webhooks WHERE stripe_event_id = ${event.id}`;
  if (already.length > 0) return res.json({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      if (!userId) { res.json({ received: true }); return; }

      if (session.mode === "subscription") {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId   = lineItems.data?.[0]?.price?.id;
        if (priceId === STRIPE_PRICE_PRO)
          await sql`UPDATE user_profiles SET current_plan = 'PRO' WHERE user_id = ${userId}`;
        else if (priceId === STRIPE_PRICE_ENTERPRISE)
          await sql`UPDATE user_profiles SET current_plan = 'ENTERPRISE' WHERE user_id = ${userId}`;
      } else if (session.mode === "payment" && session.amount_total) {
        const amount = session.amount_total / 100;
        await sql`UPDATE user_profiles SET wallet_balance = wallet_balance + ${amount} WHERE user_id = ${userId}`;
        await sql`
          INSERT INTO stock_transactions (user_id, ticker, type, shares, price_per_share, total_amount)
          VALUES (${userId}, 'WALLET', 'TOPUP', 1, ${amount}, ${amount})
        `;
      }
    }

    // Mark processed
    await sql`INSERT INTO processed_webhooks (stripe_event_id) VALUES (${event.id}) ON CONFLICT DO NOTHING`;
    res.json({ received: true });
  } catch (err) {
    console.error("[webhook] processing error:", err.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MONITORING
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/monitoring/ingest", verifyToken, async (req, res) => {
  try {
    const { apiKey } = req.body;
    const userId = req.user.id;   // from JWT
    if (!apiKey) return res.status(400).json({ error: "apiKey required" });
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
    await sql`
      INSERT INTO monitoring_keys (user_id, api_key_hash)
      VALUES (${userId}, ${hash})
      ON CONFLICT (api_key_hash) DO NOTHING
    `;
    res.json({ success: true, hash });
  } catch (err) {
    res.status(500).json({ error: "Failed to ingest key" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPLAINTS
// ═══════════════════════════════════════════════════════════════════════════

app.post("/api/complaints", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;   // from JWT
    if (!title || !description) return res.status(400).json({ error: "title and description required" });
    if (title.length > 200)       return res.status(400).json({ error: "title too long (max 200 chars)" });
    const [complaint] = await sql`
      INSERT INTO user_complaints (user_id, title, description, status)
      VALUES (${userId}, ${title}, ${description}, 'PENDING')
      RETURNING *
    `;
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

app.get("/api/complaints/:userId", verifyToken, ownsResource("userId"), async (req, res) => {
  try {
    const complaints = await sql`
      SELECT * FROM user_complaints WHERE user_id = ${req.params.userId} ORDER BY created_at DESC
    `;
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — x-admin-auth header
// ═══════════════════════════════════════════════════════════════════════════

app.get("/api/admin/analytics", verifyAdmin, async (req, res) => {
  try {
    const [users]      = await sql`SELECT COUNT(*) AS total_users, COUNT(*) FILTER (WHERE current_plan='PRO') AS pro_users, COUNT(*) FILTER (WHERE current_plan='ENTERPRISE') AS enterprise_users, COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days') AS new_this_month FROM user_profiles`;
    const [txs]        = await sql`SELECT COUNT(*) AS total_transactions, COALESCE(SUM(total_amount) FILTER (WHERE type IN ('BUY','SELL')),0) AS total_volume, COUNT(*) FILTER (WHERE type='BUY') AS buy_count, COUNT(*) FILTER (WHERE type='SELL') AS sell_count, COUNT(*) FILTER (WHERE type='TOPUP') AS topup_count FROM stock_transactions`;
    const [complaints] = await sql`SELECT COUNT(*) FILTER (WHERE status='PENDING') AS pending, COUNT(*) FILTER (WHERE status='INVESTIGATING') AS investigating, COUNT(*) FILTER (WHERE status='RESOLVED') AS resolved, COUNT(*) AS total FROM user_complaints`;
    const [wallet]     = await sql`SELECT COALESCE(SUM(wallet_balance),0) AS total_wallet, COALESCE(AVG(wallet_balance),0) AS avg_wallet FROM user_profiles`;
    res.json({
      users:       { total: parseInt(users.total_users), pro: parseInt(users.pro_users), enterprise: parseInt(users.enterprise_users), newThisMonth: parseInt(users.new_this_month) },
      transactions:{ total: parseInt(txs.total_transactions), volume: parseFloat(txs.total_volume), buys: parseInt(txs.buy_count), sells: parseInt(txs.sell_count), topups: parseInt(txs.topup_count) },
      complaints:  { pending: parseInt(complaints.pending), investigating: parseInt(complaints.investigating), resolved: parseInt(complaints.resolved), total: parseInt(complaints.total) },
      wallet:      { total: parseFloat(wallet.total_wallet), avg: parseFloat(wallet.avg_wallet) },
    });
  } catch (err) {
    console.error("[admin/analytics]", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/admin/users", verifyAdmin, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1"));
    const limit = 50;
    const offset = (page - 1) * limit;
    const users = await sql`
      SELECT u.user_id, u.email, u.name, u.wallet_balance, u.current_plan, u.is_admin, u.created_at,
             COUNT(t.id) AS tx_count,
             COALESCE(SUM(t.total_amount) FILTER (WHERE t.type IN ('BUY','SELL')),0) AS trade_volume,
             MAX(t.created_at) AS last_trade_at
      FROM user_profiles u
      LEFT JOIN stock_transactions t ON t.user_id = u.user_id
      GROUP BY u.user_id ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/transactions", verifyAdmin, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page || "1"));
    const limit  = 100;
    const offset = (page - 1) * limit;
    const txs = await sql`
      SELECT t.*, u.email, u.name, u.current_plan
      FROM stock_transactions t JOIN user_profiles u ON u.user_id = t.user_id
      ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.get("/api/admin/complaints", verifyAdmin, async (req, res) => {
  try {
    const complaints = await sql`
      SELECT c.*, u.email, u.name, u.current_plan
      FROM user_complaints c JOIN user_profiles u ON u.user_id = c.user_id
      ORDER BY CASE c.status WHEN 'PENDING' THEN 0 WHEN 'INVESTIGATING' THEN 1 ELSE 2 END, c.created_at DESC
    `;
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

app.patch("/api/admin/complaints/:id", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["PENDING","INVESTIGATING","RESOLVED"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    const [updated] = await sql`
      UPDATE user_complaints SET status = ${status}, updated_at = NOW()
      WHERE id = ${req.params.id} RETURNING *
    `;
    if (!updated) return res.status(404).json({ error: "Complaint not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

// ── Health ─────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[unhandled]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`SIFT backend listening on :${PORT}`));
}

module.exports = app;
