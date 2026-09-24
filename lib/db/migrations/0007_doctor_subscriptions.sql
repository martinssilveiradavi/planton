CREATE TABLE IF NOT EXISTS doctor_subscriptions (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  asaas_subscription_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT NOT NULL,
  value REAL NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'MONTHLY',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  next_due_date DATE,
  invoice_url TEXT,
  last_payment_id TEXT,
  last_payment_status TEXT,
  last_payment_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT doctor_subscriptions_status_check
    CHECK (status IN ('PENDENTE', 'ATIVA', 'INADIMPLENTE', 'CANCELADA')),
  CONSTRAINT doctor_subscriptions_cycle_check
    CHECK (cycle = 'MONTHLY'),
  CONSTRAINT doctor_subscriptions_value_check
    CHECK (value > 0)
);