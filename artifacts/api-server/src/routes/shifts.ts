import { Router, type IRouter, type Request, type Response } from "express";
import { db, shiftsTable, usersTable, applicationsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, sql, desc } from "drizzle-orm";
import {
  CreateShiftBody,
  UpdateShiftBody,
  GetShiftParams,
  UpdateShiftParams,
  DeleteShiftParams,
  ListShiftApplicationsParams,
  ListShiftsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireHospital } from "../middlewares/auth";

const router: IRouter = Router();

function formatShift(shift: typeof shiftsTable.$inferSelect, hospitalName: string, applicationsCount = 0) {
  return {
    id: shift.id,
    hospitalId: shift.hospitalId,
    hospitalName,
    title: shift.title,
    specialty: shift.specialty,
    description: shift.description,
    requirements: shift.requirements,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    remuneration: shift.remuneration,
    address: shift.address,
    city: shift.city,
    state: shift.state,
    latitude: shift.latitude,
    longitude: shift.longitude,
    status: shift.status,
    applicationsCount,
    createdAt: shift.createdAt.toISOString(),
    updatedAt: shift.updatedAt.toISOString(),
  };
}

// GET /shifts - list with filters
router.get("/shifts", async (req: Request, res: Response): Promise<void> => {
  const parsed = ListShiftsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { specialty, city, date, minValue, maxValue, status, page = 1, limit = 20 } = parsed.data;

  const conditions = [];

  if (status) {
    conditions.push(eq(shiftsTable.status, status as "ABERTO" | "PREENCHIDO" | "CANCELADO" | "ENCERRADO"));
  } else {
    conditions.push(eq(shiftsTable.status, "ABERTO"));
  }

  if (specialty) conditions.push(ilike(shiftsTable.specialty, `%${specialty}%`));
  if (city) conditions.push(ilike(shiftsTable.city, `%${city}%`));
  if (date) conditions.push(eq(shiftsTable.date, date));
  if (minValue !== undefined) conditions.push(gte(shiftsTable.remuneration, minValue));
  if (maxValue !== undefined) conditions.push(lte(shiftsTable.remuneration, maxValue));

  const offset = (page - 1) * limit;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shiftsTable)
    .where(and(...conditions));

  const rows = await db
    .select({
      shift: shiftsTable,
      hospitalName: usersTable.name,
      applicationsCount: sql<number>`count(${applicationsTable.id})::int`,
    })
    .from(shiftsTable)
    .leftJoin(usersTable, eq(shiftsTable.hospitalId, usersTable.id))
    .leftJoin(applicationsTable, eq(shiftsTable.id, applicationsTable.shiftId))
    .where(and(...conditions))
    .groupBy(shiftsTable.id, usersTable.name)
    .orderBy(desc(shiftsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const shifts = rows.map(({ shift, hospitalName, applicationsCount }) =>
    formatShift(shift, hospitalName ?? "", applicationsCount ?? 0)
  );

  res.json({ shifts, total: count, page, limit });
});

// GET /shifts/stats
router.get("/shifts/stats", async (_req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [{ totalOpen }] = await db
    .select({ totalOpen: sql<number>`count(*)::int` })
    .from(shiftsTable)
    .where(eq(shiftsTable.status, "ABERTO"));

  const [{ totalToday }] = await db
    .select({ totalToday: sql<number>`count(*)::int` })
    .from(shiftsTable)
    .where(and(eq(shiftsTable.status, "ABERTO"), eq(shiftsTable.date, today)));

  const bySpecialty = await db
    .select({
      specialty: shiftsTable.specialty,
      count: sql<number>`count(*)::int`,
    })
    .from(shiftsTable)
    .where(eq(shiftsTable.status, "ABERTO"))
    .groupBy(shiftsTable.specialty)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const recentRows = await db
    .select({
      shift: shiftsTable,
      hospitalName: usersTable.name,
    })
    .from(shiftsTable)
    .leftJoin(usersTable, eq(shiftsTable.hospitalId, usersTable.id))
    .where(eq(shiftsTable.status, "ABERTO"))
    .orderBy(desc(shiftsTable.createdAt))
    .limit(5);

  const recentlyAdded = recentRows.map(({ shift, hospitalName }) =>
    formatShift(shift, hospitalName ?? "", 0)
  );

  res.json({ totalOpen, totalToday, bySpecialty, recentlyAdded });
});

// GET /shifts/:id
router.get("/shifts/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetShiftParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      shift: shiftsTable,
      hospitalName: usersTable.name,
      applicationsCount: sql<number>`count(${applicationsTable.id})::int`,
    })
    .from(shiftsTable)
    .leftJoin(usersTable, eq(shiftsTable.hospitalId, usersTable.id))
    .leftJoin(applicationsTable, eq(shiftsTable.id, applicationsTable.shiftId))
    .where(eq(shiftsTable.id, params.data.id))
    .groupBy(shiftsTable.id, usersTable.name)
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Plantão não encontrado" });
    return;
  }

  res.json(formatShift(row.shift, row.hospitalName ?? "", row.applicationsCount ?? 0));
});

// POST /shifts
router.post("/shifts", requireHospital, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateShiftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [hospital] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);

  const [shift] = await db.insert(shiftsTable).values({
    hospitalId: req.session.userId!,
    title: parsed.data.title,
    specialty: parsed.data.specialty,
    description: parsed.data.description ?? null,
    requirements: parsed.data.requirements ?? null,
    date: parsed.data.date,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    remuneration: parsed.data.remuneration,
    address: parsed.data.address,
    city: parsed.data.city,
    state: parsed.data.state,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
  }).returning();

  res.status(201).json(formatShift(shift, hospital?.name ?? "", 0));
});

// PATCH /shifts/:id
router.patch("/shifts/:id", requireHospital, async (req: Request, res: Response): Promise<void> => {
  const params = UpdateShiftParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateShiftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Plantão não encontrado" });
    return;
  }

  if (existing.hospitalId !== req.session.userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const updateData: Partial<typeof shiftsTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.specialty !== undefined) updateData.specialty = parsed.data.specialty;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.requirements !== undefined) updateData.requirements = parsed.data.requirements;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.startTime !== undefined) updateData.startTime = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updateData.endTime = parsed.data.endTime;
  if (parsed.data.remuneration !== undefined) updateData.remuneration = parsed.data.remuneration;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.city !== undefined) updateData.city = parsed.data.city;
  if (parsed.data.state !== undefined) updateData.state = parsed.data.state;
  if (parsed.data.latitude !== undefined) updateData.latitude = parsed.data.latitude;
  if (parsed.data.longitude !== undefined) updateData.longitude = parsed.data.longitude;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status as "ABERTO" | "PREENCHIDO" | "CANCELADO" | "ENCERRADO";

  const [updated] = await db.update(shiftsTable).set(updateData).where(eq(shiftsTable.id, params.data.id)).returning();

  const [hospital] = await db.select().from(usersTable).where(eq(usersTable.id, updated.hospitalId)).limit(1);

  const [{ applicationsCount }] = await db
    .select({ applicationsCount: sql<number>`count(*)::int` })
    .from(applicationsTable)
    .where(eq(applicationsTable.shiftId, updated.id));

  res.json(formatShift(updated, hospital?.name ?? "", applicationsCount ?? 0));
});

// DELETE /shifts/:id
router.delete("/shifts/:id", requireHospital, async (req: Request, res: Response): Promise<void> => {
  const params = DeleteShiftParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Plantão não encontrado" });
    return;
  }

  if (existing.hospitalId !== req.session.userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  await db.delete(applicationsTable).where(eq(applicationsTable.shiftId, params.data.id));
  await db.delete(shiftsTable).where(eq(shiftsTable.id, params.data.id));

  res.sendStatus(204);
});

// GET /shifts/:id/applications
router.get("/shifts/:id/applications", requireHospital, async (req: Request, res: Response): Promise<void> => {
  const params = ListShiftApplicationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, params.data.id)).limit(1);
  if (!shift) {
    res.status(404).json({ error: "Plantão não encontrado" });
    return;
  }

  if (shift.hospitalId !== req.session.userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const rows = await db
    .select({
      application: applicationsTable,
      doctor: usersTable,
    })
    .from(applicationsTable)
    .leftJoin(usersTable, eq(applicationsTable.doctorId, usersTable.id))
    .where(eq(applicationsTable.shiftId, params.data.id))
    .orderBy(desc(applicationsTable.createdAt));

  const applications = rows.map(({ application, doctor }) => ({
    id: application.id,
    shiftId: application.shiftId,
    doctorId: application.doctorId,
    doctorName: doctor?.name ?? null,
    doctorSpecialty: doctor?.specialty ?? null,
    doctorCrm: doctor?.crmNumber ?? null,
    status: application.status,
    notes: application.notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));

  res.json(applications);
});

export default router;
