ALTER TABLE users
  ADD COLUMN IF NOT EXISTS asaas_wallet_id text,
  ADD COLUMN IF NOT EXISTS asaas_customer_id text;

CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  application_id integer NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  asaas_charge_id text,
  asaas_status text,
  invoice_url text,
  gross_amount real NOT NULL,
  platform_fee_percent real NOT NULL,
  platform_fee_amount real NOT NULL,
  doctor_amount real NOT NULL,
  status text NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
  paid_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_status_check CHECK (
    status IN ('AGUARDANDO_PAGAMENTO', 'PAGO', 'LIBERADO', 'ESTORNADO', 'FALHOU')
  ),
  CONSTRAINT payments_amounts_check CHECK (
    gross_amount >= 0
    AND platform_fee_percent >= 0
    AND platform_fee_percent <= 100
    AND platform_fee_amount >= 0
    AND doctor_amount >= 0
  )
);

CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
CREATE INDEX IF NOT EXISTS payments_asaas_charge_idx ON payments (asaas_charge_id);