import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, type, specialty, crmNumber, hospitalName, city, state } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "E-mail já cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    type,
    specialty: specialty ?? null,
    crmNumber: crmNumber ?? null,
    hospitalName: hospitalName ?? null,
    city: city ?? null,
    state: state ?? null,
  }).returning();

  req.session.userId = user.id;
  req.session.userType = user.type;

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    specialty: user.specialty,
    crmNumber: user.crmNumber,
    hospitalName: user.hospitalName,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
    return;
  }

  req.session.userId = user.id;
  req.session.userType = user.type;

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    specialty: user.specialty,
    crmNumber: user.crmNumber,
    hospitalName: user.hospitalName,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.sendStatus(204);
  });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    specialty: user.specialty,
    crmNumber: user.crmNumber,
    hospitalName: user.hospitalName,
    city: user.city,
    state: user.state,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
