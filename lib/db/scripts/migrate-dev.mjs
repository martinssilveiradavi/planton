import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running migrations");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("migrate:dev cannot run with NODE_ENV=production; use Replit Publish");
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(currentDirectory, "..", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS planton_schema_migrations (
    version text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  for (const fileName of migrationFiles) {
    const sql = await readFile(join(migrationsDirectory, fileName), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM planton_schema_migrations WHERE version = $1",
      [fileName],
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration ${fileName} was modified after being applied`);
      }
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO planton_schema_migrations (version, checksum) VALUES ($1, $2)",
        [fileName, checksum],
      );
      await client.query("COMMIT");
      console.log(`Aplicada: ${fileName}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log("Migrações de desenvolvimento atualizadas.");
} finally {
  client.release();
  await pool.end();
}