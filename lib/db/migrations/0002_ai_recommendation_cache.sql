CREATE TABLE IF NOT EXISTS ai_recommendation_cache (
  id serial PRIMARY KEY,
  doctor_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  recommendations jsonb NOT NULL,
  model text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  estimated_cost_usd real,
  cache_hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_recommendation_cache_doctor_key_unique
  ON ai_recommendation_cache (doctor_id, cache_key);
CREATE INDEX IF NOT EXISTS ai_recommendation_cache_doctor_idx
  ON ai_recommendation_cache (doctor_id);