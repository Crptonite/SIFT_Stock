D:\NYP_S1Y2\Full_Stack_App_Dev\SIFT_Stock System: SIFT Stock backend engine. Location: D:\NYP_S1Y2\Full_Stack_App_Dev\SIFT_Stock\sift_stock_ai\lucas. Stack: Node + Express + NeonDB + Neon Auth + Stripe + Vercel Serverless. Trade Environment: 'SIMULATE' (All transactions are simulated locally inside NeonDB ledger; no live Moomoo broker connection). Database Core:

* user_profiles (user_id PK, wallet_balance, current_plan ENUM('FREE','PRO','ENTERPRISE'), is_admin)
* stock_transactions (id, user_id, ticker, type ENUM('BUY','SELL','TOPUP'), shares, price_per_share, total_amount)
* monitoring_keys (id, user_id, api_key_hash)
* user_complaints (id, user_id, title, description, status ENUM('PENDING','INVESTIGATING','RESOLVED')) Stripe Keys Setup:
* STRIPE_PRICE_PRO='price_1TZb2OLZ3OJ1F35x3wuFCALD'
* STRIPE_PRICE_ENTERPRISE='price_1TZb56LZ3OJ1F35x4lw1GEF1' Business Logic Rules:

1. /api/transactions (BUY/SELL): Atomic TX block (FOR UPDATE balance lock). Updates wallet_balance, writes ledger.
2. Auto-Tier Upgrade: Post-transaction hook sums total cumulative volume (BUY+SELL). Thresholds: >=$10k -> PRO, >=$50k -> ENTERPRISE. Updates current_plan.
3. /api/webhooks/stripe: Handles checkout.session.completed with rawBody bypass. If checking out via Price IDs above, forces manual plan switch; if standard cash top-up, credits wallet_balance and logs transaction.
4. /api/monitoring/ingest: Hashes (SHA-256) + replicates external application tracking API keys.
5. Admin Module Guards: Routes /api/admin/* use verifyAdminSession header tracking ('x-admin-auth'). Exposes analytics summaries, transaction histories, global user directories, and interactive complaint ticket workflows. Files: index.js, schema.sql, vercel.json, .env, ai.log. Maintain state without modifying structural abstractions. Use shadcn home icons user icons metrics chat and history save for admin and search and upload document for admin site
User shld be able to see balance and trade real timeNeon Auth supports both Google and GitHub login through OAuth. You can enable them from the Neon Console or configure them through the API. Supported providers currently include:

* ✅ Google
* ✅ GitHub
* ✅ Microsoft
* ✅ Vercel