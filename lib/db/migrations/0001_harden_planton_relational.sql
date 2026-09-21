ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_state text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS hospital_type text NOT NULL DEFAULT 'hospital';
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS doctor_type text NOT NULL DEFAULT 'doctor';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
  ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_id_type_unique_idx
  ON users (id, type);
CREATE UNIQUE INDEX IF NOT EXISTS users_crm_number_unique_idx
  ON users (lower(crm_number))
  WHERE crm_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_cnpj_unique_idx
  ON users (lower(cnpj))
  WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_type_idx ON users (type);
CREATE INDEX IF NOT EXISTS users_specialty_idx ON users (specialty);
CREATE INDEX IF NOT EXISTS users_city_state_idx ON users (city, state);

CREATE INDEX IF NOT EXISTS shifts_hospital_id_idx ON shifts (hospital_id);
CREATE INDEX IF NOT EXISTS shifts_status_date_idx ON shifts (status, date);
CREATE INDEX IF NOT EXISTS shifts_specialty_idx ON shifts (specialty);
CREATE INDEX IF NOT EXISTS shifts_city_state_idx ON shifts (city, state);

CREATE UNIQUE INDEX IF NOT EXISTS applications_shift_doctor_unique_idx
  ON applications (shift_id, doctor_id);
CREATE INDEX IF NOT EXISTS applications_doctor_id_idx ON applications (doctor_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_type_check;
ALTER TABLE users ADD CONSTRAINT users_type_check
  CHECK (type IN ('doctor', 'hospital'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_profile_check;
ALTER TABLE users ADD CONSTRAINT users_profile_check CHECK (
  (type = 'doctor' AND specialty IS NOT NULL AND crm_number IS NOT NULL)
  OR (type = 'hospital' AND hospital_name IS NOT NULL)
);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_state_check;
ALTER TABLE users ADD CONSTRAINT users_state_check
  CHECK (state IS NULL OR char_length(state) = 2);

ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_status_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_status_check
  CHECK (status IN ('ABERTO', 'PREENCHIDO', 'CANCELADO', 'ENCERRADO'));
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_hospital_type_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_hospital_type_check
  CHECK (hospital_type = 'hospital');
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_remuneration_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_remuneration_check
  CHECK (remuneration >= 0);
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_coordinates_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_coordinates_check CHECK (
  (latitude IS NULL AND longitude IS NULL)
  OR (
    latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
  )
);

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('PENDENTE', 'SELECIONADO', 'REJEITADO'));
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_doctor_type_check;
ALTER TABLE applications ADD CONSTRAINT applications_doctor_type_check
  CHECK (doctor_type = 'doctor');

ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_hospital_id_users_id_fk;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_hospital_role_fk;
ALTER TABLE shifts ADD CONSTRAINT shifts_hospital_role_fk
  FOREIGN KEY (hospital_id, hospital_type)
  REFERENCES users (id, type);

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_doctor_id_users_id_fk;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_doctor_role_fk;
ALTER TABLE applications ADD CONSTRAINT applications_doctor_role_fk
  FOREIGN KEY (doctor_id, doctor_type)
  REFERENCES users (id, type);

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_shift_id_shifts_id_fk;
ALTER TABLE applications ADD CONSTRAINT applications_shift_id_shifts_id_fk
  FOREIGN KEY (shift_id)
  REFERENCES shifts (id)
  ON DELETE CASCADE;