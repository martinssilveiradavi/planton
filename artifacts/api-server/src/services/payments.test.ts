import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, describe, test } from "node:test";
import {
  calculatePaymentAmounts,
  createPaymentForApplication,
  updatePaymentFromAsaasEvent,
} from "./payments";
import {
  createAsaasPayment,
  createAsaasSubscription,
} from "../lib/asaas";
import app from "../app";
import {
  applicationsTable,
  db,
  doctorSubscriptionsTable,
  paymentsTable,
  pool,
  sessionsTable,
  shiftsTable,
  usersTable,
} from "@workspace/db";
import { eq, isNull } from "drizzle-orm";

const originalFetch = globalThis.fetch;
const originalEnv = {
  baseUrl: process.env.ASAAS_BASE_URL,
  apiKey: process.env.ASAAS_API_KEY,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalEnv.baseUrl === undefined) delete process.env.ASAAS_BASE_URL;
  else process.env.ASAAS_BASE_URL = originalEnv.baseUrl;
  if (originalEnv.apiKey === undefined) delete process.env.ASAAS_API_KEY;
  else process.env.ASAAS_API_KEY = originalEnv.apiKey;
});

describe("cobranças Asaas", { concurrency: false }, () => {
  test("preserva o valor do plantão e calcula o split em centavos", () => {
    assert.deepEqual(calculatePaymentAmounts(1234.57, 10), {
      grossAmount: 1234.57,
      platformFeeAmount: 123.46,
      doctorAmount: 1111.11,
    });
  });

  test("envia exatamente o valor individual para uma nova cobrança", async () => {
    process.env.ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";
    process.env.ASAAS_API_KEY = "test-key";
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      if (requests.length === 1) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          id: "pay_test_123",
          status: "PENDING",
          invoiceUrl: "https://sandbox.asaas.com/i/test",
          value: 1234.57,
        }),
        { status: 200 },
      );
    };

    const payment = await createAsaasPayment({
      customerId: "cus_test",
      value: 1234.57,
      doctorAmount: 1111.11,
      doctorWalletId: "wallet_test",
      description: "Pagamento do plantão",
      externalReference: "planton:application:test",
    });

    assert.equal(payment.id, "pay_test_123");
    assert.equal(requests.length, 2);
    const body = JSON.parse(String(requests[1].init?.body)) as {
      value: number;
      billingType: string;
      split: Array<{ walletId: string; fixedValue: number }>;
    };
    assert.equal(body.value, 1234.57);
    assert.equal(body.billingType, "UNDEFINED");
    assert.deepEqual(body.split, [
      { walletId: "wallet_test", fixedValue: 1111.11 },
    ]);
  });

  test("cria assinatura mensal de R$ 129,90 sem duplicar referência", async () => {
    process.env.ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";
    process.env.ASAAS_API_KEY = "test-key";
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      if (requests.length === 1) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      if (requests.length === 2) {
        return new Response(
          JSON.stringify({
            id: "sub_test_123",
            status: "ACTIVE",
            value: 129.9,
            cycle: "MONTHLY",
            nextDueDate: "2099-01-01",
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "pay_subscription_123",
              status: "PENDING",
              invoiceUrl: "https://sandbox.asaas.com/i/subscription",
              value: 129.9,
              subscription: "sub_test_123",
            },
          ],
        }),
        { status: 200 },
      );
    };

    const subscription = await createAsaasSubscription({
      customerId: "cus_test",
      value: 129.9,
      description: "Assinatura mensal do Planton",
      externalReference: "planton:doctor-subscription:test",
    });

    assert.equal(subscription.id, "sub_test_123");
    assert.equal(subscription.invoiceUrl, "https://sandbox.asaas.com/i/subscription");
    const body = JSON.parse(String(requests[1].init?.body)) as {
      value: number;
      cycle: string;
      billingType: string;
      externalReference: string;
    };
    assert.equal(body.value, 129.9);
    assert.equal(body.cycle, "MONTHLY");
    assert.equal(body.billingType, "UNDEFINED");
    assert.equal(
      body.externalReference,
      "planton:doctor-subscription:test",
    );
  });

  test("não cria uma segunda cobrança para a mesma referência externa", async () => {
    process.env.ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";
    process.env.ASAAS_API_KEY = "test-key";
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "pay_existing",
              status: "PENDING",
              invoiceUrl: "https://sandbox.asaas.com/i/existing",
              value: 900,
            },
          ],
        }),
        { status: 200 },
      );
    };

    const payment = await createAsaasPayment({
      customerId: "cus_test",
      value: 900,
      doctorAmount: 810,
      description: "Pagamento do plantão",
      externalReference: "planton:application:existing",
    });

    assert.equal(payment.id, "pay_existing");
    assert.equal(calls, 1);
  });

  test("atualiza pagamento recebido de forma idempotente pelo webhook", async () => {
    const [application] = await db
      .select({ id: applicationsTable.id })
      .from(applicationsTable)
      .leftJoin(
        paymentsTable,
        eq(paymentsTable.applicationId, applicationsTable.id),
      )
      .where(isNull(paymentsTable.id))
      .limit(1);
    assert.ok(application, "A base de teste precisa ter uma candidatura");

    const [created] = await db
      .insert(paymentsTable)
      .values({
        applicationId: application.id,
        asaasChargeId: `pay_webhook_test_${Date.now()}`,
        asaasStatus: "PENDING",
        invoiceUrl: "https://sandbox.asaas.com/i/webhook",
        grossAmount: 900,
        platformFeePercent: 10,
        platformFeeAmount: 90,
        doctorAmount: 810,
      })
      .returning();

    try {
      const first = await updatePaymentFromAsaasEvent({
        chargeId: created.asaasChargeId!,
        asaasStatus: "RECEIVED",
        paidAt: "2026-09-21T12:00:00.000Z",
      });
      const second = await updatePaymentFromAsaasEvent({
        chargeId: created.asaasChargeId!,
        asaasStatus: "RECEIVED",
        paidAt: "2026-09-21T12:00:00.000Z",
      });

      assert.equal(first?.id, created.id);
      assert.equal(second?.id, created.id);
      assert.equal(second?.status, "PAGO");
      assert.equal(second?.asaasStatus, "RECEIVED");
    } finally {
      await db.delete(paymentsTable).where(eq(paymentsTable.id, created.id));
    }
  });

const uniqueId = `payments-${Date.now()}-${process.pid}`;
const hospitalAuthId = `${uniqueId}-hospital`;
const doctorAuthId = `${uniqueId}-doctor`;
const hospitalSid = `${uniqueId}-hospital-session`;
const doctorSid = `${uniqueId}-doctor-session`;
const hospitalEmail = `${uniqueId}-hospital@example.test`;
const doctorEmail = `${uniqueId}-doctor@example.test`;
const remuneration = 1375.49;
const webhookToken = `${uniqueId}-webhook-token`;

let apiServer: Server;
let asaasServer: Server;
let apiBaseUrl: string;
let asaasBaseUrl: string;
let hospitalId: number;
let doctorId: number;
let shiftId: number;
let applicationId: number;
let chargeId: string;
let subscriptionAsaasId: string;

const asaasPaymentRequests: Array<{ path: string; body: Record<string, unknown> }> = [];
let asaasPaymentDelayMs = 0;

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  body: unknown,
) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

async function readRequestBody(request: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

async function requestJson(
  path: string,
  init: RequestInit & { cookie?: string } = {},
) {
  const { cookie, headers, ...requestInit } = init;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie: `sid=${cookie}` } : {}),
      ...headers,
    },
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { response, body };
}

function sessionValues(sid: string, authId: string, email: string) {
  return {
    sid,
    sess: {
      user: {
        id: authId,
        email,
        firstName: "Teste",
        lastName: "Planton",
        profileImageUrl: null,
      },
      access_token: "test-token",
    },
    expire: new Date(Date.now() + 60_000),
  };
}

describe("cobrança Asaas no fluxo de seleção", { concurrency: false }, () => {
before(async () => {
  asaasServer = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://asaas.test");
    const method = request.method ?? "GET";

    if (method === "GET" && requestUrl.pathname === "/customers") {
      sendJson(response, 200, { data: [] });
      return;
    }

    if (method === "GET" && requestUrl.pathname === "/payments") {
      sendJson(response, 200, { data: [] });
      return;
    }

    if (method === "POST" && requestUrl.pathname === "/customers") {
      sendJson(response, 200, { id: `cus_${uniqueId}` });
      return;
    }

    if (method === "POST" && requestUrl.pathname === "/payments") {
      const body = await readRequestBody(request);
      asaasPaymentRequests.push({ path: requestUrl.pathname, body });
      if (asaasPaymentDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, asaasPaymentDelayMs));
      }
      chargeId = `pay_${uniqueId}`;
      sendJson(response, 200, {
        id: chargeId,
        status: "PENDING",
        invoiceUrl: `https://sandbox.asaas.com/i/${chargeId}`,
        value: body.value,
      });
      return;
    }

    sendJson(response, 404, { error: "Rota sandbox não encontrada" });
  });

  await new Promise<void>((resolve) => {
    asaasServer.listen(0, "127.0.0.1", resolve);
  });
  const asaasAddress = asaasServer.address() as AddressInfo;
  asaasBaseUrl = `http://127.0.0.1:${asaasAddress.port}`;

  process.env.ASAAS_BASE_URL = asaasBaseUrl;
  process.env.ASAAS_API_KEY = "sandbox-test-key";
  process.env.ASAAS_WEBHOOK_TOKEN = webhookToken;
  process.env.PLATFORM_FEE_PERCENT = "10";

  const [hospital] = await db
    .insert(usersTable)
    .values({
      replitAuthId: hospitalAuthId,
      name: "Hospital Sandbox",
      email: hospitalEmail,
      passwordHash: null,
      type: "hospital",
      hospitalName: "Hospital Sandbox",
      cnpj: `${uniqueId}-cnpj`,
      phone: "1133333333",
      address: "Rua do Teste, 1",
      city: "São Paulo",
      state: "SP",
    })
    .returning({ id: usersTable.id });
  hospitalId = hospital.id;

  const [doctor] = await db
    .insert(usersTable)
    .values({
      replitAuthId: doctorAuthId,
      name: "Médico Sandbox",
      email: doctorEmail,
      passwordHash: null,
      type: "doctor",
      specialty: "Cardiologia",
      crmNumber: `${uniqueId}-crm`,
      crmState: "SP",
      phone: "11999999999",
      city: "São Paulo",
      state: "SP",
      asaasWalletId: `wal_${uniqueId}`,
    })
    .returning({ id: usersTable.id });
  doctorId = doctor.id;

  subscriptionAsaasId = `sub_${uniqueId}`;
  await db.insert(doctorSubscriptionsTable).values({
    doctorId,
    asaasSubscriptionId: subscriptionAsaasId,
    asaasCustomerId: `cus_${uniqueId}`,
    value: 129.9,
    cycle: "MONTHLY",
    status: "ATIVA",
  });

  const [shift] = await db
    .insert(shiftsTable)
    .values({
      hospitalId,
      title: "Plantão Sandbox",
      specialty: "Cardiologia",
      description: "Plantão para validar a cobrança individual.",
      requirements: "CRM ativo",
      date: "2099-01-01",
      startTime: "08:00",
      endTime: "20:00",
      remuneration,
      address: "Rua do Teste, 1",
      city: "São Paulo",
      state: "SP",
    })
    .returning({ id: shiftsTable.id });
  shiftId = shift.id;

  await db.insert(sessionsTable).values([
    sessionValues(hospitalSid, hospitalAuthId, hospitalEmail),
    sessionValues(doctorSid, doctorAuthId, doctorEmail),
  ]);

  apiServer = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  const apiAddress = apiServer.address() as AddressInfo;
  apiBaseUrl = `http://127.0.0.1:${apiAddress.port}`;
});

after(async () => {
  if (apiServer) {
    await new Promise<void>((resolve, reject) => {
      apiServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (asaasServer) {
    await new Promise<void>((resolve, reject) => {
      asaasServer.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await db.delete(sessionsTable).where(
    eq(sessionsTable.sid, hospitalSid),
  );
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, doctorSid));
  if (applicationId) {
    await db
      .delete(paymentsTable)
      .where(eq(paymentsTable.applicationId, applicationId));
    await db
      .delete(applicationsTable)
      .where(eq(applicationsTable.id, applicationId));
  }
  if (shiftId) {
    await db.delete(shiftsTable).where(eq(shiftsTable.id, shiftId));
  }
  if (hospitalId) {
    await db.delete(usersTable).where(eq(usersTable.id, hospitalId));
  }
  if (doctorId) {
    await db
      .delete(doctorSubscriptionsTable)
      .where(eq(doctorSubscriptionsTable.doctorId, doctorId));
    await db.delete(usersTable).where(eq(usersTable.id, doctorId));
  }
  await pool.end();
});

  test("permite candidaturas sem cobrar o hospital", async () => {
    const created = await requestJson("/api/applications", {
      method: "POST",
      cookie: doctorSid,
      body: JSON.stringify({ shiftId }),
    });
    assert.equal(created.response.status, 201);
    applicationId = Number(created.body.id);

    const selected = await requestJson(`/api/applications/${applicationId}`, {
      method: "PATCH",
      cookie: hospitalSid,
      body: JSON.stringify({ status: "SELECIONADO" }),
    });
    assert.equal(selected.response.status, 200);
    assert.equal(selected.body.payment, null);

    const paymentPosts = asaasPaymentRequests.filter(
      (request) => request.path === "/payments",
    );
    assert.equal(paymentPosts.length, 0);

    const repeatedSelection = await requestJson(
      `/api/applications/${applicationId}`,
      {
        method: "PATCH",
        cookie: hospitalSid,
        body: JSON.stringify({ status: "SELECIONADO" }),
      },
    );
    assert.equal(repeatedSelection.response.status, 200);
    assert.equal(repeatedSelection.body.payment, null);
    assert.equal(
      asaasPaymentRequests.filter((request) => request.path === "/payments")
        .length,
      0,
    );

    asaasPaymentDelayMs = 25;
    let simultaneousPayments: Awaited<
      ReturnType<typeof createPaymentForApplication>
    >[];
    try {
      simultaneousPayments = await Promise.all([
        createPaymentForApplication(applicationId),
        createPaymentForApplication(applicationId),
      ]);
    } finally {
      asaasPaymentDelayMs = 0;
    }

    assert.equal(simultaneousPayments[0].id, simultaneousPayments[1].id);
    assert.equal(
      asaasPaymentRequests.filter((request) => request.path === "/payments")
        .length,
      1,
    );
    const storedPayments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.applicationId, applicationId));
    assert.equal(storedPayments.length, 1);

  });
});
});