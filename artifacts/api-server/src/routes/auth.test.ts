import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { eq } from "drizzle-orm";
import app from "../app";
import { db, pool, sessionsTable, usersTable } from "@workspace/db";
import { upsertIdentity } from "./auth";

const uniqueId = `oidc-${Date.now()}-${process.pid}`;
const authId = `${uniqueId}-sub`;
const email = `${uniqueId}@example.test`;
const sid = `${uniqueId}-session`;
let server: Server;
let baseUrl: string;
let appUserId: number;

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { response, body };
}

before(async () => {
  const [user] = await db
    .insert(usersTable)
    .values({
      replitAuthId: authId,
      name: "Davi Teste",
      email,
      passwordHash: null,
      type: null,
    })
    .returning({ id: usersTable.id });
  appUserId = user.id;

  await db.insert(sessionsTable).values({
    sid,
    sess: {
      user: {
        id: authId,
        email,
        firstName: "Davi",
        lastName: "Teste",
        profileImageUrl: null,
      },
      access_token: "test-token",
    },
    expire: new Date(Date.now() + 60_000),
  });

  server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  const address = server.address() as AddressInfo | null;
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
  await db.delete(usersTable).where(eq(usersTable.id, appUserId));
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
});

describe("Replit Auth e perfil profissional", () => {
  test("expõe estado anônimo sem erro", async () => {
    const { response, body } = await requestJson("/api/auth/user");
    assert.equal(response.status, 200);
    assert.equal(body.user, null);
  });

  test("rejeita conclusão de perfil sem sessão OIDC", async () => {
    const { response } = await requestJson("/api/auth/profile", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
  });

  test("exige e-mail confirmado para vincular conta legada", async () => {
    const legacyEmail = `${uniqueId}-legacy@example.test`;
    const [legacy] = await db
      .insert(usersTable)
      .values({
        name: "Conta Legada",
        email: legacyEmail,
        passwordHash: "legacy-hash",
        type: "doctor",
        specialty: "Cardiologia",
        crmNumber: `${uniqueId}-legacy-crm`,
      })
      .returning({ id: usersTable.id });

    try {
      await assert.rejects(
        upsertIdentity({
          sub: `${uniqueId}-legacy-unverified`,
          email: legacyEmail,
        }),
        /Verified email is required/,
      );

      const linked = await upsertIdentity({
        sub: `${uniqueId}-legacy-verified`,
        email: legacyEmail,
        email_verified: true,
      });
      assert.equal(linked.id, legacy.id);
      assert.equal(linked.replitAuthId, `${uniqueId}-legacy-verified`);

      await assert.rejects(
        upsertIdentity({
          sub: `${uniqueId}-conflicting-sub`,
          email: legacyEmail,
          email_verified: true,
        }),
        /already linked/,
      );
    } finally {
      await db.delete(usersTable).where(eq(usersTable.id, legacy.id));
    }
  });

  test("conclui o perfil autenticado e preserva o tipo da conta", async () => {
    const cookie = `sid=${sid}`;
    const doctorProfile = {
      name: "Davi Teste",
      type: "doctor",
      specialty: "Ortopedia",
      crmNumber: `${uniqueId}-crm`,
      crmState: "SP",
      phone: "11999999999",
      city: "São Paulo",
      state: "SP",
    };

    const completed = await requestJson("/api/auth/profile", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify(doctorProfile),
    });
    assert.equal(completed.response.status, 201);
    assert.equal(completed.body.type, "doctor");

    const current = await requestJson("/api/auth/me", {
      headers: { cookie },
    });
    assert.equal(current.response.status, 200);
    assert.equal(current.body.specialty, "Ortopedia");
    assert.equal(current.body.crmNumber, doctorProfile.crmNumber);

    const attemptedRoleChange = await requestJson("/api/auth/profile", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify({
        name: "Instituição indevida",
        type: "hospital",
        hospitalName: "Hospital indevido",
        cnpj: `${uniqueId}-cnpj`,
        phone: "1133333333",
        address: "Rua Teste, 1",
        city: "São Paulo",
        state: "SP",
      }),
    });
    assert.equal(attemptedRoleChange.response.status, 409);

    const [stored] = await db
      .select({ type: usersTable.type })
      .from(usersTable)
      .where(eq(usersTable.id, appUserId));
    assert.equal(stored.type, "doctor");
  });
});