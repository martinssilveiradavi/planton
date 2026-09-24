import { db, doctorSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || !req.appUserId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

export function requireHospital(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || !req.appUserId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (req.appUserType !== "hospital") {
    res.status(403).json({ error: "Acesso restrito a hospitais" });
    return;
  }
  next();
}

export function requireDoctor(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || !req.appUserId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (req.appUserType !== "doctor") {
    res.status(403).json({ error: "Acesso restrito a médicos" });
    return;
  }
  next();
}

export async function requireActiveDoctorSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated() || !req.appUserId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (req.appUserType !== "doctor") {
    res.status(403).json({ error: "Acesso restrito a médicos" });
    return;
  }
  const [subscription] = await db
    .select({ status: doctorSubscriptionsTable.status })
    .from(doctorSubscriptionsTable)
    .where(eq(doctorSubscriptionsTable.doctorId, req.appUserId))
    .limit(1);
  if (subscription?.status !== "ATIVA") {
    res.status(402).json({
      error: "Assinatura mensal ativa necessária para acessar o Planton",
      code: "SUBSCRIPTION_REQUIRED",
    });
    return;
  }
  next();
}
