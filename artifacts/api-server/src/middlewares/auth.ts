import { type Request, type Response, type NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userType: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

export function requireHospital(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (req.session.userType !== "hospital") {
    res.status(403).json({ error: "Acesso restrito a hospitais" });
    return;
  }
  next();
}

export function requireDoctor(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (req.session.userType !== "doctor") {
    res.status(403).json({ error: "Acesso restrito a médicos" });
    return;
  }
  next();
}
