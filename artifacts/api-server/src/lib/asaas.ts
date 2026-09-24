import type { User } from "@workspace/db";

type AsaasCustomer = {
  id: string;
};

export type AsaasPayment = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  value: number;
  subscription?: string | null;
};

export type AsaasSubscription = {
  id: string;
  status?: string;
  value: number;
  cycle: string;
  nextDueDate?: string | null;
  description?: string | null;
};

export class AsaasError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

const ASAAS_SANDBOX_TEST_CPF = "24971563792";

function getAsaasBaseUrl() {
  const directBaseUrl = process.env.ASAAS_BASE_URL?.trim();
  const directHostname = directBaseUrl
    ? new URL(directBaseUrl).hostname
    : "";
  const isLocalTestBase =
    directHostname === "127.0.0.1" || directHostname === "localhost";
  const useSandbox =
    process.env.ASAAS_ENVIRONMENT === "sandbox" ||
    (process.env.NODE_ENV !== "production" &&
      Boolean(process.env.ASAAS_BASE_URL_SANDBOX));
  const configuredBaseUrl =
    isLocalTestBase
      ? directBaseUrl
      : useSandbox
      ? process.env.ASAAS_BASE_URL_SANDBOX || process.env.ASAAS_BASE_URL
      : process.env.ASAAS_BASE_URL;
  const baseUrl = configuredBaseUrl?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new AsaasError("ASAAS_BASE_URL não configurada", 503);
  return baseUrl;
}

function ensureSafeAsaasEnvironment(baseUrl: string) {
  const hostname = new URL(baseUrl).hostname;
  const isLocalTestServer =
    hostname === "127.0.0.1" || hostname === "localhost";
  if (
    process.env.NODE_ENV !== "production" &&
    !baseUrl.toLowerCase().includes("sandbox") &&
    !isLocalTestServer
  ) {
    throw new AsaasError(
      "O ambiente de testes deve usar a URL e a chave do Sandbox Asaas",
      503,
    );
  }
}

function getAsaasApiKey() {
  const baseUrl = getAsaasBaseUrl();
  const configuredApiKey = baseUrl.toLowerCase().includes("sandbox")
    ? process.env.ASAAS_API_KEY_SANDBOX || process.env.ASAAS_API_KEY
    : process.env.ASAAS_API_KEY;
  const apiKey = configuredApiKey?.trim();
  if (!apiKey) throw new AsaasError("ASAAS_API_KEY não configurada", 503);
  return apiKey;
}

async function asaasRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getAsaasBaseUrl();
  ensureSafeAsaasEnvironment(baseUrl);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: getAsaasApiKey(),
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => null)) as
    | { errors?: Array<{ description?: string }> }
    | T
    | null;
  if (!response.ok) {
    const description =
      body &&
      typeof body === "object" &&
      "errors" in body &&
      Array.isArray(body.errors)
        ? body.errors
            .map((error) => error.description)
            .filter(Boolean)
            .join("; ")
        : `HTTP ${response.status}`;
    throw new AsaasError(`Asaas: ${description}`, response.status);
  }
  return body as T;
}

function getCustomerCpfCnpj(user: User) {
  if (getAsaasBaseUrl().toLowerCase().includes("sandbox")) {
    return ASAAS_SANDBOX_TEST_CPF;
  }
  const cpfCnpj = user.cnpj?.replace(/\D/g, "");
  return cpfCnpj || undefined;
}

export async function getOrCreateAsaasCustomer(user: User) {
  if (user.asaasCustomerId) return user.asaasCustomerId;

  const existing = await asaasRequest<{ data?: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(user.email)}`,
  );
  if (existing.data?.[0]?.id) return existing.data[0].id;

  const cpfCnpj = getCustomerCpfCnpj(user);
  const customer = await asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      ...(cpfCnpj ? { cpfCnpj } : {}),
      ...(user.phone ? { mobilePhone: user.phone } : {}),
      externalReference: `planton:user:${user.id}`,
    }),
  });
  return customer.id;
}

export async function findAsaasPaymentByReference(reference: string) {
  const result = await asaasRequest<{ data?: AsaasPayment[] }>(
    `/payments?externalReference=${encodeURIComponent(reference)}`,
  );
  return result.data?.[0] ?? null;
}

export async function createAsaasPayment(input: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
  doctorWalletId?: string | null;
  doctorAmount: number;
}) {
  const existing = await findAsaasPaymentByReference(input.externalReference);
  if (existing) return existing;

  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: input.value,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      description: input.description,
      externalReference: input.externalReference,
      ...(input.doctorWalletId
        ? {
            split: [
              {
                walletId: input.doctorWalletId,
                fixedValue: input.doctorAmount,
              },
            ],
          }
        : {}),
    }),
  });
}

export async function createAsaasSubscription(input: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}) {
  const existing = await asaasRequest<{ data?: AsaasSubscription[] }>(
    `/subscriptions?externalReference=${encodeURIComponent(input.externalReference)}`,
  );
  if (existing.data?.[0]) {
    const subscription = existing.data[0];
    const payments = await asaasRequest<{ data?: AsaasPayment[] }>(
      `/subscriptions/${subscription.id}/payments?limit=1`,
    );
    return {
      ...subscription,
      invoiceUrl: payments.data?.[0]?.invoiceUrl ?? null,
    };
  }

  const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const subscription = await asaasRequest<AsaasSubscription>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        customer: input.customerId,
        billingType: "UNDEFINED",
        value: input.value,
        cycle: "MONTHLY",
        nextDueDate,
        description: input.description,
        externalReference: input.externalReference,
      }),
    },
  );
  const payments = await asaasRequest<{ data?: AsaasPayment[] }>(
    `/subscriptions/${subscription.id}/payments?limit=1`,
  );
  return {
    ...subscription,
    invoiceUrl: payments.data?.[0]?.invoiceUrl ?? null,
  };
}

export async function deleteAsaasSubscription(subscriptionId: string) {
  await asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "DELETE",
  });
}