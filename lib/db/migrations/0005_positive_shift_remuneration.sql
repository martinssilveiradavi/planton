ALTER TABLE shifts
  DROP CONSTRAINT IF EXISTS shifts_remuneration_check;

ALTER TABLE shifts
  ADD CONSTRAINT shifts_remuneration_check CHECK (remuneration > 0);