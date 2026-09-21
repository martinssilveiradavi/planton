import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running the seed");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("The fictional seed cannot run with NODE_ENV=production");
}

const SEED_PASSWORD_HASH =
  "$2b$10$nddpt0krYg5qSxWU3UXzU.njIKd69akXFRdrGlmx/HIrNK2joDARC";

const hospitals = [
  ["hospital.aurora@seed.planton.dev", "Marina Costa", "Hospital Aurora", "FICTICIO-CNPJ-001", "(11) 4000-1001", "Av. Paulista, 1000", "São Paulo", "SP"],
  ["hospital.horizonte@seed.planton.dev", "Rafael Lima", "Hospital Horizonte", "FICTICIO-CNPJ-002", "(11) 4000-1002", "Rua Vergueiro, 800", "São Paulo", "SP"],
  ["hospital.viver@seed.planton.dev", "Paula Nunes", "Instituto Viver", "FICTICIO-CNPJ-003", "(21) 4000-1003", "Rua Voluntários, 320", "Rio de Janeiro", "RJ"],
  ["hospital.serra@seed.planton.dev", "Eduardo Reis", "Hospital da Serra", "FICTICIO-CNPJ-004", "(31) 4000-1004", "Av. Afonso Pena, 1500", "Belo Horizonte", "MG"],
  ["hospital.litoral@seed.planton.dev", "Carla Menezes", "Hospital do Litoral", "FICTICIO-CNPJ-005", "(13) 4000-1005", "Av. Ana Costa, 450", "Santos", "SP"],
  ["hospital.central@seed.planton.dev", "Lucas Barros", "Centro Médico Central", "FICTICIO-CNPJ-006", "(41) 4000-1006", "Rua XV de Novembro, 700", "Curitiba", "PR"],
  ["hospital.esperanca@seed.planton.dev", "Renata Alves", "Hospital Esperança", "FICTICIO-CNPJ-007", "(51) 4000-1007", "Av. Ipiranga, 2200", "Porto Alegre", "RS"],
  ["hospital.vida@seed.planton.dev", "Bruno Tavares", "Clínica Vida", "FICTICIO-CNPJ-008", "(71) 4000-1008", "Av. Oceânica, 900", "Salvador", "BA"],
  ["hospital.norte@seed.planton.dev", "Fernanda Rocha", "Hospital Norte", "FICTICIO-CNPJ-009", "(81) 4000-1009", "Av. Agamenon Magalhães, 1200", "Recife", "PE"],
  ["hospital.cerrado@seed.planton.dev", "Gustavo Freitas", "Hospital Cerrado", "FICTICIO-CNPJ-010", "(61) 4000-1010", "SHLS Quadra 716, Bloco A", "Brasília", "DF"],
];

const doctors = [
  ["ana.clinica@seed.planton.dev", "Dra. Ana Martins", "Clínica Médica", "CRM/SP 900001", "SP", "(11) 98800-0001", "São Paulo", "SP"],
  ["beatriz.clinica@seed.planton.dev", "Dra. Beatriz Souza", "Clínica Médica", "CRM/RJ 900002", "RJ", "(21) 98800-0002", "Rio de Janeiro", "RJ"],
  ["carlos.pediatria@seed.planton.dev", "Dr. Carlos Ribeiro", "Pediatria", "CRM/SP 900003", "SP", "(11) 98800-0003", "São Paulo", "SP"],
  ["daniela.pediatria@seed.planton.dev", "Dra. Daniela Alves", "Pediatria", "CRM/MG 900004", "MG", "(31) 98800-0004", "Belo Horizonte", "MG"],
  ["eduardo.emergencia@seed.planton.dev", "Dr. Eduardo Ramos", "Medicina de Emergência", "CRM/PR 900005", "PR", "(41) 98800-0005", "Curitiba", "PR"],
  ["flavia.emergencia@seed.planton.dev", "Dra. Flávia Gomes", "Medicina de Emergência", "CRM/RS 900006", "RS", "(51) 98800-0006", "Porto Alegre", "RS"],
  ["gabriel.cardio@seed.planton.dev", "Dr. Gabriel Castro", "Cardiologia", "CRM/BA 900007", "BA", "(71) 98800-0007", "Salvador", "BA"],
  ["helena.cardio@seed.planton.dev", "Dra. Helena Moraes", "Cardiologia", "CRM/PE 900008", "PE", "(81) 98800-0008", "Recife", "PE"],
  ["igor.ortopedia@seed.planton.dev", "Dr. Igor Fernandes", "Ortopedia", "CRM/DF 900009", "DF", "(61) 98800-0009", "Brasília", "DF"],
  ["juliana.cirurgia@seed.planton.dev", "Dra. Juliana Prado", "Cirurgia Geral", "CRM/SP 900010", "SP", "(13) 98800-0010", "Santos", "SP"],
];

const shifts = [
  ["shift-clinica-01", 0, "Plantão de Clínica Médica - Aurora", "Clínica Médica", "2026-09-05", "07:00", "19:00", 1800, "São Paulo", "SP", -23.5614, -46.6559, "ABERTO"],
  ["shift-pediatria-01", 1, "Plantão Pediátrico - Horizonte", "Pediatria", "2026-09-06", "07:00", "19:00", 1900, "São Paulo", "SP", -23.5794, -46.6391, "ABERTO"],
  ["shift-emergencia-01", 2, "Emergência Adulto - Viver", "Medicina de Emergência", "2026-09-07", "19:00", "07:00", 2400, "Rio de Janeiro", "RJ", -22.9519, -43.1842, "ABERTO"],
  ["shift-cardio-01", 3, "Cobertura Cardiológica - Serra", "Cardiologia", "2026-09-08", "08:00", "20:00", 2600, "Belo Horizonte", "MG", -19.9245, -43.9352, "ABERTO"],
  ["shift-clinica-02", 4, "Clínica Médica Noturna - Litoral", "Clínica Médica", "2026-09-09", "19:00", "07:00", 2100, "Santos", "SP", -23.9608, -46.3336, "ABERTO"],
  ["shift-pediatria-02", 5, "Pronto Atendimento Infantil - Central", "Pediatria", "2026-09-10", "07:00", "19:00", 1850, "Curitiba", "PR", -25.4284, -49.2733, "ABERTO"],
  ["shift-emergencia-02", 6, "Sala de Emergência - Esperança", "Medicina de Emergência", "2026-09-11", "19:00", "07:00", 2500, "Porto Alegre", "RS", -30.0346, -51.2177, "ABERTO"],
  ["shift-cardio-02", 7, "Cardiologia Clínica - Vida", "Cardiologia", "2026-09-12", "08:00", "20:00", 2700, "Salvador", "BA", -12.9714, -38.5014, "ABERTO"],
  ["shift-clinica-03", 8, "Retaguarda Clínica - Norte", "Clínica Médica", "2026-09-13", "07:00", "19:00", 1750, "Recife", "PE", -8.0476, -34.877, "PREENCHIDO"],
  ["shift-pediatria-03", 9, "Pediatria Hospitalar - Cerrado", "Pediatria", "2026-09-14", "07:00", "19:00", 2000, "Brasília", "DF", -15.7942, -47.8822, "ABERTO"],
  ["shift-emergencia-03", 0, "Emergência Fim de Semana - Aurora", "Medicina de Emergência", "2026-09-15", "19:00", "07:00", 2550, "São Paulo", "SP", -23.5614, -46.6559, "ABERTO"],
  ["shift-cardio-03", 1, "Cardiologia Noturna - Horizonte", "Cardiologia", "2026-09-16", "19:00", "07:00", 2900, "São Paulo", "SP", -23.5794, -46.6391, "ABERTO"],
  ["shift-ortopedia-01", 2, "Plantão de Ortopedia - Viver", "Ortopedia", "2026-09-17", "07:00", "19:00", 2300, "Rio de Janeiro", "RJ", -22.9519, -43.1842, "ABERTO"],
  ["shift-cirurgia-01", 3, "Cirurgia Geral - Serra", "Cirurgia Geral", "2026-09-18", "07:00", "19:00", 3200, "Belo Horizonte", "MG", -19.9245, -43.9352, "ABERTO"],
  ["shift-cirurgia-02", 4, "Retaguarda Cirúrgica - Litoral", "Cirurgia Geral", "2026-09-19", "19:00", "07:00", 3400, "Santos", "SP", -23.9608, -46.3336, "CANCELADO"],
];

const applications = [
  [0, 0], [0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [2, 5], [3, 6],
  [4, 0], [4, 1], [5, 2], [5, 3], [6, 4], [6, 5], [7, 6], [8, 0],
  [9, 2], [10, 4], [11, 7], [12, 8],
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const hospitalIds = [];
  for (const [email, name, hospitalName, cnpj, phone, address, city, state] of hospitals) {
    const result = await client.query(
      `INSERT INTO users
        (name, email, password_hash, type, hospital_name, cnpj, phone, address, city, state)
       VALUES ($1, $2, $3, 'hospital', $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET
         name = excluded.name,
         hospital_name = excluded.hospital_name,
         cnpj = excluded.cnpj,
         phone = excluded.phone,
         address = excluded.address,
         city = excluded.city,
         state = excluded.state,
         updated_at = now()
       RETURNING id`,
      [name, email, SEED_PASSWORD_HASH, hospitalName, cnpj, phone, address, city, state],
    );
    hospitalIds.push(result.rows[0].id);
  }

  const doctorIds = [];
  for (const [email, name, specialty, crmNumber, crmState, phone, city, state] of doctors) {
    const result = await client.query(
      `INSERT INTO users
        (name, email, password_hash, type, specialty, crm_number, crm_state, phone, city, state)
       VALUES ($1, $2, $3, 'doctor', $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET
         name = excluded.name,
         specialty = excluded.specialty,
         crm_number = excluded.crm_number,
         crm_state = excluded.crm_state,
         phone = excluded.phone,
         city = excluded.city,
         state = excluded.state,
         updated_at = now()
       RETURNING id`,
      [name, email, SEED_PASSWORD_HASH, specialty, crmNumber, crmState, phone, city, state],
    );
    doctorIds.push(result.rows[0].id);
  }

  const shiftIds = [];
  for (const [seedKey, hospitalIndex, title, specialty, date, startTime, endTime, remuneration, city, state, latitude, longitude, status] of shifts) {
    const hospitalId = hospitalIds[hospitalIndex];
    let result = await client.query(
      `SELECT id FROM shifts
       WHERE hospital_id = $1 AND title = $2 AND date = $3 AND start_time = $4
       LIMIT 1`,
      [hospitalId, title, date, startTime],
    );
    if (result.rowCount === 0) {
      result = await client.query(
        `INSERT INTO shifts
          (hospital_id, title, specialty, description, requirements, date, start_time, end_time,
           remuneration, address, city, state, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        [
          hospitalId,
          title,
          specialty,
          `Plantão fictício de demonstração (${seedKey}).`,
          "CRM ativo e experiência compatível com a especialidade.",
          date,
          startTime,
          endTime,
          remuneration,
          hospitals[hospitalIndex][5],
          city,
          state,
          latitude,
          longitude,
          status,
        ],
      );
    }
    shiftIds.push(result.rows[0].id);
  }

  const fixtureApplicationPairs = applications.map(([shiftIndex, doctorIndex]) => [
    shiftIds[shiftIndex],
    doctorIds[doctorIndex],
  ]);
  const fixturePairValues = fixtureApplicationPairs
    .map((_, index) => `($${index * 2 + 1}::int, $${index * 2 + 2}::int)`)
    .join(", ");
  await client.query(
    `DELETE FROM applications AS application
     USING (VALUES ${fixturePairValues}) AS fixture(shift_id, doctor_id)
     WHERE application.shift_id = fixture.shift_id
       AND application.doctor_id = fixture.doctor_id`,
    fixtureApplicationPairs.flat(),
  );

  for (let index = 0; index < applications.length; index += 1) {
    const [shiftIndex, doctorIndex] = applications[index];
    const status = index === 8 ? "SELECIONADO" : index === 14 ? "REJEITADO" : "PENDENTE";
    await client.query(
      `INSERT INTO applications (shift_id, doctor_id, status, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (shift_id, doctor_id) DO UPDATE SET
         status = excluded.status,
         notes = excluded.notes,
         updated_at = now()`,
      [
        shiftIds[shiftIndex],
        doctorIds[doctorIndex],
        status,
        "Candidatura fictícia criada pelo seed do Planton.",
      ],
    );
  }

  await client.query("COMMIT");
  console.log("Seed concluído: 10 instituições, 10 médicos, 15 plantões e 20 candidaturas de referência.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}