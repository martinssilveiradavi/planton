import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before validating data");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const checks = [
  ["Contagens", `SELECT
    count(*) FILTER (WHERE type = 'hospital')::int AS hospitals,
    count(*) FILTER (WHERE type = 'doctor')::int AS doctors
    FROM users`],
  ["Plantões e candidaturas", `SELECT
    (SELECT count(*)::int FROM shifts) AS shifts,
    (SELECT count(*)::int FROM applications) AS applications`],
  ["Plantões abertos por especialidade", `SELECT specialty, count(*)::int AS total
    FROM shifts WHERE status = 'ABERTO'
    GROUP BY specialty ORDER BY total DESC, specialty`],
  ["JOIN relacional", `SELECT s.id, s.title, h.hospital_name, a.id AS application_id, d.name AS doctor_name
    FROM shifts s
    JOIN users h ON h.id = s.hospital_id
    LEFT JOIN applications a ON a.shift_id = s.id
    LEFT JOIN users d ON d.id = a.doctor_id
    ORDER BY s.id, a.id LIMIT 20`],
  ["Plantões sem candidatura", `SELECT s.id, s.title
    FROM shifts s LEFT JOIN applications a ON a.shift_id = s.id
    WHERE a.id IS NULL ORDER BY s.id`],
  ["Médicos sem candidatura", `SELECT d.id, d.name
    FROM users d LEFT JOIN applications a ON a.doctor_id = d.id
    WHERE d.type = 'doctor' AND a.id IS NULL ORDER BY d.id`],
  ["Órfãos", `SELECT
    (SELECT count(*)::int FROM shifts s LEFT JOIN users h ON h.id = s.hospital_id WHERE h.id IS NULL) AS shifts_without_hospital,
    (SELECT count(*)::int FROM applications a LEFT JOIN shifts s ON s.id = a.shift_id WHERE s.id IS NULL) AS applications_without_shift,
    (SELECT count(*)::int FROM applications a LEFT JOIN users d ON d.id = a.doctor_id WHERE d.id IS NULL) AS applications_without_doctor`],
  ["Duplicidades", `SELECT shift_id, doctor_id, count(*)::int AS total
    FROM applications GROUP BY shift_id, doctor_id HAVING count(*) > 1`],
  ["Compatibilidade de especialidade", `SELECT
    count(*) FILTER (WHERE d.specialty = s.specialty)::int AS compatible,
    count(*)::int AS total,
    round(
      100.0 * count(*) FILTER (WHERE d.specialty = s.specialty) / nullif(count(*), 0),
      1
    ) AS compatible_percentage
    FROM applications a
    JOIN shifts s ON s.id = a.shift_id
    JOIN users d ON d.id = a.doctor_id`],
  ["Maior número de candidaturas por plantão", `SELECT s.id, s.title, count(a.id)::int AS applications
    FROM shifts s
    LEFT JOIN applications a ON a.shift_id = s.id
    GROUP BY s.id, s.title
    ORDER BY applications DESC, s.id
    LIMIT 1`],
];

try {
  for (const [label, query] of checks) {
    const result = await pool.query(query);
    console.log(`\n## ${label}`);
    console.table(result.rows);
  }

  const minimums = await pool.query(`SELECT
    (SELECT count(*) FROM users WHERE type = 'hospital') >= 10 AS hospitals_ok,
    (SELECT count(*) FROM users WHERE type = 'doctor') >= 10 AS doctors_ok,
    (SELECT count(*) FROM shifts) >= 15 AS shifts_ok,
    (SELECT count(*) FROM applications) >= 20 AS applications_ok,
    NOT EXISTS (
      SELECT 1 FROM applications GROUP BY shift_id, doctor_id HAVING count(*) > 1
    ) AS duplicates_ok,
    NOT EXISTS (
      SELECT 1 FROM shifts s LEFT JOIN users h ON h.id = s.hospital_id WHERE h.id IS NULL
    ) AS shift_orphans_ok,
    NOT EXISTS (
      SELECT 1 FROM applications a LEFT JOIN shifts s ON s.id = a.shift_id WHERE s.id IS NULL
    ) AS application_shift_orphans_ok,
    NOT EXISTS (
      SELECT 1 FROM applications a LEFT JOIN users d ON d.id = a.doctor_id WHERE d.id IS NULL
    ) AS application_doctor_orphans_ok,
    (
      SELECT count(*) FILTER (WHERE d.specialty = s.specialty) * 2 > count(*)
      FROM applications a
      JOIN shifts s ON s.id = a.shift_id
      JOIN users d ON d.id = a.doctor_id
    ) AS specialty_compatibility_ok,
    (
      SELECT count(*) >= 3
      FROM applications
      GROUP BY shift_id
      ORDER BY count(*) DESC
      LIMIT 1
    ) AS three_applications_on_one_shift_ok,
    NOT EXISTS (
      SELECT 1
      FROM shifts s
      JOIN users u ON u.id = s.hospital_id
      WHERE u.type <> 'hospital'
    ) AS shift_owner_roles_ok,
    NOT EXISTS (
      SELECT 1
      FROM applications a
      JOIN users u ON u.id = a.doctor_id
      WHERE u.type <> 'doctor'
    ) AS application_doctor_roles_ok`);

  const failed = Object.entries(minimums.rows[0]).filter(([, passed]) => !passed);
  if (failed.length > 0) {
    throw new Error(`Validação falhou: ${failed.map(([name]) => name).join(", ")}`);
  }
  console.log("\nTodas as validações obrigatórias passaram.");
} finally {
  await pool.end();
}