CREATE TABLE IF NOT EXISTS shop_orders (
 id UUID PRIMARY KEY,
 order_number VARCHAR(60) NOT NULL UNIQUE,
 idempotency_key UUID NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 status VARCHAR(24) NOT NULL DEFAULT 'new',
 customer JSONB NOT NULL,
 delivery JSONB NOT NULL,
 items JSONB NOT NULL,
 subtotal_cents INTEGER NOT NULL,
 delivery_cents INTEGER NOT NULL,
 total_cents INTEGER NOT NULL,
 currency CHAR(3) NOT NULL DEFAULT 'EUR',
 payment_method VARCHAR(24) NOT NULL DEFAULT 'cod',
 shipping_number VARCHAR(120),
 invoice_external_id VARCHAR(120)
);
CREATE INDEX IF NOT EXISTS shop_orders_created_idx ON shop_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx ON shop_orders(status);
CREATE TABLE IF NOT EXISTS shop_outbox (
 id BIGSERIAL PRIMARY KEY,
 order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
 event_key VARCHAR(110) NOT NULL UNIQUE,
 event_type VARCHAR(48) NOT NULL,
 state VARCHAR(24) NOT NULL DEFAULT 'queued',
 attempts INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 processed_at TIMESTAMPTZ
);
