-- ── SIFT Stock — NeonDB Schema ─────────────────────────────────────────────

-- ENUMs
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('FREE','PRO','ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tx_type AS ENUM ('BUY','SELL','TOPUP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM ('PENDING','INVESTIGATING','RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        UNIQUE NOT NULL,
  password_hash  TEXT,
  name           TEXT,
  wallet_balance NUMERIC(18,2) NOT NULL DEFAULT 10000.00,
  current_plan   plan_tier   NOT NULL DEFAULT 'FREE',
  is_admin       BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  ticker         TEXT        NOT NULL,
  type           tx_type     NOT NULL,
  shares         NUMERIC(18,6) NOT NULL,
  price_per_share NUMERIC(18,4) NOT NULL,
  total_amount   NUMERIC(18,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_keys (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  api_key_hash   TEXT        UNIQUE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_complaints (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  status         complaint_status NOT NULL DEFAULT 'PENDING',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger: auto-update updated_at on complaints ──────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON user_complaints;
CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON user_complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tx_user_id     ON stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_created_at  ON stock_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comp_user_id   ON user_complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_status    ON user_complaints(status);

-- ── Seed admin account ─────────────────────────────────────────────────────
-- Password: admin123 (bcrypt hash rounds=12)
INSERT INTO user_profiles (email, password_hash, name, wallet_balance, current_plan, is_admin)
VALUES (
  'admin@siftstock.sg',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsBCsJDFlWdMG8fGNiZrMpqfknbK',
  'SIFT Admin',
  999999.00,
  'ENTERPRISE',
  true
)
ON CONFLICT (email) DO NOTHING;

-- ── Webhook idempotency ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processed_webhooks (
  stripe_event_id TEXT PRIMARY KEY,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
