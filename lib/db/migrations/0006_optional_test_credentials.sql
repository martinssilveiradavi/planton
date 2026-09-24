ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_profile_auth_check;

ALTER TABLE users
  ADD CONSTRAINT users_profile_auth_check CHECK (
    type IS NULL
    OR (type = 'doctor' AND specialty IS NOT NULL)
    OR (type = 'hospital' AND hospital_name IS NOT NULL)
  );