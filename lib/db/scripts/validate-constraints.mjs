import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before validating constraints");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

async function expectRejected(label, query, expectedCode) {
  await client.query("SAVEPOINT constraint_check");
  try {
    await client.query(query);
    throw new Error(`${label}: o banco aceitou uma operação inválida`);
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT constraint_check");
    if (error.code !== expectedCode) {
      throw error;
    }
    console.log(`✓ ${label}`);
  }
}

try {
  await client.query("BEGIN");

  await expectRejected(
    "status inválido de plantão rejeitado",
    "UPDATE shifts SET status = 'INVALIDO' WHERE id = (SELECT min(id) FROM shifts)",
    "23514",
  );
  await expectRejected(
    "remuneração negativa rejeitada",
    "UPDATE shifts SET remuneration = -1 WHERE id = (SELECT min(id) FROM shifts)",
    "23514",
  );
  await expectRejected(
    "longitude sem latitude rejeitada",
    "UPDATE shifts SET latitude = NULL, longitude = 1 WHERE id = (SELECT min(id) FROM shifts)",
    "23514",
  );
  await expectRejected(
    "latitude sem longitude rejeitada",
    "UPDATE shifts SET latitude = 1, longitude = NULL WHERE id = (SELECT min(id) FROM shifts)",
    "23514",
  );
  await expectRejected(
    "status inválido de candidatura rejeitado",
    "UPDATE applications SET status = 'INVALIDO' WHERE id = (SELECT min(id) FROM applications)",
    "23514",
  );
  await expectRejected(
    "candidatura duplicada rejeitada",
    `INSERT INTO applications (shift_id, doctor_id)
     SELECT shift_id, doctor_id FROM applications ORDER BY id LIMIT 1`,
    "23505",
  );
  await expectRejected(
    "plantão órfão rejeitado",
    "UPDATE shifts SET hospital_id = 2147483647 WHERE id = (SELECT min(id) FROM shifts)",
    "23503",
  );
  await expectRejected(
    "médico como instituição do plantão rejeitado",
    `UPDATE shifts
     SET hospital_id = (SELECT id FROM users WHERE type = 'doctor' ORDER BY id LIMIT 1)
     WHERE id = (SELECT min(id) FROM shifts)`,
    "23503",
  );
  await expectRejected(
    "instituição como médica candidata rejeitada",
    `UPDATE applications
     SET doctor_id = (SELECT id FROM users WHERE type = 'hospital' ORDER BY id LIMIT 1)
     WHERE id = (SELECT min(id) FROM applications)`,
    "23503",
  );

  const application = await client.query(
    "SELECT shift_id FROM applications ORDER BY id LIMIT 1",
  );
  const shiftId = application.rows[0].shift_id;
  await client.query("SAVEPOINT cascade_check");
  await client.query("DELETE FROM shifts WHERE id = $1", [shiftId]);
  const remaining = await client.query(
    "SELECT count(*)::int AS total FROM applications WHERE shift_id = $1",
    [shiftId],
  );
  if (remaining.rows[0].total !== 0) {
    throw new Error("exclusão em cascata não removeu as candidaturas do plantão");
  }
  console.log("✓ exclusão de plantão remove candidaturas sem deixar órfãos");
  await client.query("ROLLBACK TO SAVEPOINT cascade_check");

  await client.query("ROLLBACK");
  console.log("Todas as constraints obrigatórias rejeitaram dados inválidos.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}