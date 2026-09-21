ALTER TABLE users
  ADD COLUMN IF NOT EXISTS replit_auth_id text;

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ALTER COLUMN type DROP NOT NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_type_check;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_profile_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_type_auth_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_type_auth_check
      CHECK (type IS NULL OR type IN ('doctor', 'hospital'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_profile_auth_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_profile_auth_check
      CHECK (
        type IS NULL
        OR (type = 'doctor' AND specialty IS NOT NULL AND crm_number IS NOT NULL)
        OR (type = 'hospital' AND hospital_name IS NOT NULL)
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_replit_auth_id_unique
  ON users (replit_auth_id);

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire
  ON sessions (expire);