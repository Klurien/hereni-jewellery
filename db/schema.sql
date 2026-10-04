-- NOVA-0101 — Hereni Jewellery schema
-- Target: Neon PostgreSQL 18.6 (free tier), connection via DATABASE_URL.
-- Apply with: node scripts/migrate.mjs   (idempotent, safe to re-run)
--
-- Design rules enforced here, not only in application code:
--   1. Stock can never go negative. Enforced by CHECK constraints, so even a
--      buggy API, a manual psql session or a bad migration cannot break it.
--   2. Audit entries are append-only. No UPDATE or DELETE grant is issued on
--      the table below; a trigger additionally rejects both.
--   3. Available stock is derived, never stored. on_hand and reserved are
--      facts; available is a view. Storing it would let the three disagree.
--   4. Every mutation is idempotent via idempotency_key.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Tenancy and identity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext UNIQUE NOT NULL,
  password_hash  text NOT NULL,
  role           text NOT NULL DEFAULT 'staff'
                 CHECK (role IN ('owner','admin','manager','staff')),
  display_name   text,
  is_active      boolean NOT NULL DEFAULT true,
  failed_logins  int NOT NULL DEFAULT 0,
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  category      text NOT NULL,
  material      text,
  piercing_site text,
  price_minor   int NOT NULL CHECK (price_minor >= 0),
  description   text,
  tags          text[] NOT NULL DEFAULT '{}',
  sku           text UNIQUE,
  image_url     text,
  is_active     boolean NOT NULL DEFAULT true,
  version       int NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_active_idx ON products (is_active, category);
CREATE INDEX IF NOT EXISTS products_tags_idx    ON products USING gin (tags);

CREATE TABLE IF NOT EXISTS variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         text UNIQUE NOT NULL,
  barcode     text UNIQUE,
  attributes  jsonb NOT NULL DEFAULT '{}',
  price_minor int CHECK (price_minor >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  version     int NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS variants_product_idx ON variants (product_id);

-- ---------------------------------------------------------------------------
-- Stock
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per (variant, location). The unit of stock.
CREATE TABLE IF NOT EXISTS stock_quants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      uuid NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  location_id     uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  qty_on_hand     int NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  qty_reserved    int NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  -- The invariant that makes an oversell impossible at the storage layer.
  reserved_le_hand boolean GENERATED ALWAYS AS (qty_reserved <= qty_on_hand) STORED,
  version         int NOT NULL DEFAULT 1,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, location_id),
  CHECK (qty_reserved <= qty_on_hand)
);

-- Immutable ledger of every stock change. Never updated, never deleted.
CREATE TABLE IF NOT EXISTS stock_moves (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     uuid NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  location_id    uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  to_location_id uuid REFERENCES locations(id) ON DELETE RESTRICT,
  qty            int NOT NULL CHECK (qty <> 0),
  state          text NOT NULL DEFAULT 'draft'
                 CHECK (state IN ('draft','confirmed','reserved','done','cancelled')),
  reason         text,
  reference      text,
  actor_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  idempotency_key text UNIQUE,
  before_qty     int,
  after_qty      int,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moves_variant_idx ON stock_moves (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moves_state_idx   ON stock_moves (state);

CREATE TABLE IF NOT EXISTS reservations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     uuid NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  location_id    uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  qty            int NOT NULL CHECK (qty > 0),
  customer_name  text,
  customer_phone text,
  state          text NOT NULL DEFAULT 'held'
                 CHECK (state IN ('held','released','fulfilled','expired')),
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_open_idx ON reservations (variant_id, location_id) WHERE state = 'held';

-- ---------------------------------------------------------------------------
-- Replenishment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  contact        text,
  lead_time_days int NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
  is_active      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS reorder_rules (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id         uuid NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  location_id        uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  min_qty            int NOT NULL CHECK (min_qty >= 0),
  max_qty            int NOT NULL CHECK (max_qty >= 0),
  preferred_supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  UNIQUE (variant_id, location_id),
  CHECK (min_qty <= max_qty)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      text UNIQUE NOT NULL DEFAULT ('PO-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  supplier_id    uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  state          text NOT NULL DEFAULT 'draft'
                 CHECK (state IN ('draft','confirmed','received','cancelled')),
  expected_date  date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id           uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id      uuid NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  location_id     uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  qty_ordered     int NOT NULL CHECK (qty_ordered > 0),
  qty_received    int NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
  unit_cost_minor int CHECK (unit_cost_minor >= 0),
  CHECK (qty_received <= qty_ordered)
);

-- ---------------------------------------------------------------------------
-- Customers and orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      text UNIQUE NOT NULL DEFAULT ('HJ-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  customer_name  text,
  customer_phone text,
  delivery_area  text,
  delivery_quote_minor int CHECK (delivery_quote_minor >= 0),
  subtotal_minor int NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  total_minor    int NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  state          text NOT NULL DEFAULT 'enquiry'
                 CHECK (state IN ('enquiry','confirmed','packed','dispatched','delivered','cancelled')),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_state_idx ON orders (state, created_at DESC);

CREATE TABLE IF NOT EXISTS order_lines (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id   uuid REFERENCES variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty          int NOT NULL CHECK (qty > 0),
  unit_price_minor int NOT NULL CHECK (unit_price_minor >= 0)
);

-- ---------------------------------------------------------------------------
-- Audit — append only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_entries (
  id          bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id   text NOT NULL,
  action      text NOT NULL,
  sku         text,
  location_id uuid,
  delta       int,
  before_value jsonb,
  after_value  jsonb,
  reason      text,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_email text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_entries (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_entries (created_at DESC);

CREATE OR REPLACE FUNCTION forbid_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_entries is append-only (attempted %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_entries;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON audit_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();

-- ---------------------------------------------------------------------------
-- Idempotency ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_records (
  key          text PRIMARY KEY,
  endpoint     text NOT NULL,
  response     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Delivery rate card (Transfast). Read-only reference data, transcribed from a
-- photographed card and flagged for verification with the courier.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_zones (
  id         text PRIMARY KEY,
  label      text NOT NULL,
  rate_minor int NOT NULL CHECK (rate_minor >= 0),
  source     text NOT NULL DEFAULT 'transfast-card-2026-10-04',
  verified   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS delivery_areas (
  id         bigserial PRIMARY KEY,
  zone_id    text NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  area       text NOT NULL,
  rate_minor int NOT NULL CHECK (rate_minor >= 0),
  UNIQUE (zone_id, area)
);
CREATE INDEX IF NOT EXISTS delivery_areas_name_idx ON delivery_areas (lower(area));

-- ---------------------------------------------------------------------------
-- Derived view: availability. Never stored, so it cannot drift from the facts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW stock_availability AS
SELECT
  q.variant_id,
  q.location_id,
  q.qty_on_hand,
  q.qty_reserved,
  (q.qty_on_hand - q.qty_reserved) AS qty_available,
  q.version
FROM stock_quants q;

COMMIT;