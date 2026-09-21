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
