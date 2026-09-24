import {
  CompleteProfileBody,
  GetCurrentAuthUserResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import * as oidc from "openid-client";
import { getDoctorSubscription, formatSubscription } from "../services/subscriptions";
import {
  clearSession,
  createSession,
  getOidcConfig,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;
const router: IRouter = Router();

function getOrigin(req: Request) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }
  return value.replace(/\/+$/, "") || "/";
}

function profilePathFor(returnTo: string) {
  return returnTo === "/" ? "/register" : `${returnTo}/register`;
}

function formatUser(
  user: typeof usersTable.$inferSelect,
  subscription: ReturnType<typeof formatSubscription> = null,
) {
  if (!user.type) throw new Error("Professional profile is incomplete");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    specialty: user.specialty,
    crmNumber: user.crmNumber,
    crmState: user.crmState,
    hospitalName: user.hospitalName,
    cnpj: user.cnpj,
    phone: user.phone,
    address: user.address,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
    subscription,
  };
}

function getUniqueViolation(error: unknown): { constraint?: string } | null {
  let current = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return null;
    const databaseError = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (databaseError.code === "23505") {
      return {
        constraint:
          typeof databaseError.constraint === "string"
            ? databaseError.constraint
            : undefined,
      };
    }
    current = databaseError.cause;
  }
  return null;
}

function getDuplicateError(constraint?: string) {
  if (constraint?.includes("crm")) return "CRM já cadastrado";
  if (constraint?.includes("cnpj")) return "CNPJ já cadastrado";
  if (constraint?.includes("email")) return "E-mail já cadastrado";
  return "Dados profissionais já cadastrados";
}

export async function upsertIdentity(claims: Record<string, unknown>) {
  const authId = typeof claims.sub === "string" ? claims.sub : "";
  const email =
    typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (!authId || !email) throw new Error("OIDC identity has no email");
  const emailVerified =
    claims.email_verified === true || claims.email_verified === "true";
  if (claims.email_verified === false || claims.email_verified === "false") {
    throw new Error("OIDC identity email is not verified");
  }

  const [existingByAuthId] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.replitAuthId, authId))
    .limit(1);
  if (existingByAuthId) return existingByAuthId;

  const [existingByEmail] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${email}`)
    .limit(1);

  if (existingByEmail) {
    if (!emailVerified) {
      throw new Error(
        "Verified email is required to link an existing account",
      );
    }
    if (
      existingByEmail.replitAuthId &&
      existingByEmail.replitAuthId !== authId
    ) {
      throw new Error("Email is already linked to another OIDC identity");
    }
    const [user] = await db
      .update(usersTable)
      .set({ replitAuthId: authId, updatedAt: new Date() })
      .where(eq(usersTable.id, existingByEmail.id))
      .returning();
    return user;
  }

  const firstName =
    typeof claims.first_name === "string" ? claims.first_name : "";
  const lastName =
    typeof claims.last_name === "string" ? claims.last_name : "";
  const name =
    `${firstName} ${lastName}`.trim() ||
    (typeof claims.name === "string" ? claims.name : "") ||
    email.split("@")[0];

  const [user] = await db
    .insert(usersTable)
    .values({
      replitAuthId: authId,
      name,
      email,
      passwordHash: null,
      type: null,
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const returnTo = getSafeReturnTo(req.query.returnTo);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);
  res.redirect(redirectTo.href);
});

router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const codeVerifier = req.cookies?.code_verifier as string | undefined;
  const nonce = req.cookies?.nonce as string | undefined;
  const expectedState = req.cookies?.state as string | undefined;
  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch (error) {
    req.log.error({ err: error }, "OIDC callback failed");
    res.redirect("/api/login");
    return;
  }

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  let appUser: typeof usersTable.$inferSelect;
  try {
    appUser = await upsertIdentity(
      claims as unknown as Record<string, unknown>,
    );
  } catch (error) {
    req.log.error({ err: error }, "OIDC identity linking failed");
    res.redirect("/login?error=account_link");
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      firstName:
        typeof claims.first_name === "string" ? claims.first_name : null,
      lastName:
        typeof claims.last_name === "string" ? claims.last_name : null,
      profileImageUrl:
        typeof claims.profile_image_url === "string"
          ? claims.profile_image_url
          : typeof claims.picture === "string"
            ? claims.picture
            : null,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  const returnTo = getSafeReturnTo(req.cookies?.return_to);
  for (const cookie of ["code_verifier", "nonce", "state", "return_to"]) {
    res.clearCookie(cookie, { path: "/" });
  }
  res.redirect(appUser.type ? returnTo : profilePathFor(returnTo));
});

router.get("/logout", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const returnTo = getSafeReturnTo(req.query.returnTo);
  const postLogoutRedirectUrl = new URL(returnTo, `${getOrigin(req)}/`).href;
  await clearSession(res, getSessionId(req));
  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: postLogoutRedirectUrl,
  });
  res.redirect(endSessionUrl.href);
});

router.post(
  "/auth/profile",
  async (req: Request, res: Response): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const parsed = CompleteProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const professionalFields =
      parsed.data.type === "doctor"
        ? {
            specialty: parsed.data.specialty,
            crmNumber: parsed.data.crmNumber ?? null,
            crmState: parsed.data.crmState ?? null,
            hospitalName: null,
            cnpj: null,
            address: null,
          }
        : {
            specialty: null,
            crmNumber: null,
            crmState: null,
            hospitalName: parsed.data.hospitalName,
            cnpj: parsed.data.cnpj ?? null,
            address: parsed.data.address,
          };

    try {
      const [user] = await db
        .update(usersTable)
        .set({
          name: parsed.data.name,
          type: parsed.data.type,
          phone: parsed.data.phone,
          city: parsed.data.city,
          state: parsed.data.state,
          ...professionalFields,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usersTable.replitAuthId, req.user.id),
            isNull(usersTable.type),
          ),
        )
        .returning();
      if (!user) {
        const [existing] = await db
          .select({ type: usersTable.type })
          .from(usersTable)
          .where(eq(usersTable.replitAuthId, req.user.id))
          .limit(1);
        res.status(existing?.type ? 409 : 404).json({
          error: existing?.type
            ? "Perfil profissional já concluído"
            : "Conta autenticada não encontrada",
        });
        return;
      }
      const subscription =
        user.type === "doctor"
          ? formatSubscription(await getDoctorSubscription(user.id))
          : null;
      res.status(201).json(formatUser(user, subscription));
    } catch (error) {
      const uniqueViolation = getUniqueViolation(error);
      if (uniqueViolation) {
        res
          .status(400)
          .json({ error: getDuplicateError(uniqueViolation.constraint) });
        return;
      }
      throw error;
    }
  },
);

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated() || !req.appUserId) {
    res.status(401).json({ error: "Perfil profissional não concluído" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.appUserId))
    .limit(1);
  if (!user?.type) {
    res.status(401).json({ error: "Perfil profissional não concluído" });
    return;
  }
  const subscription =
    user.type === "doctor"
      ? formatSubscription(await getDoctorSubscription(user.id))
      : null;
  res.json(formatUser(user, subscription));
});

export default router;