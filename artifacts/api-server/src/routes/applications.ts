import { Router, type IRouter, type Request, type Response } from "express";
import { db, applicationsTable, shiftsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateApplicationBody,
  UpdateApplicationBody,
  UpdateApplicationParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatShiftForApp(shift: typeof shiftsTable.$inferSelect, hospitalName: string) {
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
    applicationsCount: 0,
    createdAt: shift.createdAt.toISOString(),
    updatedAt: shift.updatedAt.toISOString(),
  };
}

// GET /applications - list current user's applications
router.get("/applications", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      application: applicationsTable,
      shift: shiftsTable,
      hospital: usersTable,
    })
    .from(applicationsTable)
    .leftJoin(shiftsTable, eq(applicationsTable.shiftId, shiftsTable.id))
    .leftJoin(usersTable, eq(shiftsTable.hospitalId, usersTable.id))
    .where(eq(applicationsTable.doctorId, req.session.userId!))
    .orderBy(desc(applicationsTable.createdAt));

  const applications = rows.map(({ application, shift, hospital }) => ({
    id: application.id,
    shiftId: application.shiftId,
    doctorId: application.doctorId,
    status: application.status,
    notes: application.notes,
    shift: shift ? formatShiftForApp(shift, hospital?.name ?? "") : undefined,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));

  res.json(applications);
});

// POST /applications - doctor applies to a shift
router.post("/applications", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { shiftId, notes } = parsed.data;

  // Check shift exists and is open
  const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, shiftId)).limit(1);
  if (!shift) {
    res.status(404).json({ error: "Plantão não encontrado" });
    return;
  }
  if (shift.status !== "ABERTO") {
    res.status(400).json({ error: "Este plantão não está disponível para candidatura" });
    return;
  }

  // Check if already applied
  const existing = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.shiftId, shiftId), eq(applicationsTable.doctorId, req.session.userId!)))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Você já se candidatou a este plantão" });
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);

  const [application] = await db.insert(applicationsTable).values({
    shiftId,
    doctorId: req.session.userId!,
    notes: notes ?? null,
  }).returning();

  res.status(201).json({
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
  });
});

// PATCH /applications/:id - hospital updates application status
router.patch("/applications/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select({
      application: applicationsTable,
      shift: shiftsTable,
    })
    .from(applicationsTable)
    .leftJoin(shiftsTable, eq(applicationsTable.shiftId, shiftsTable.id))
    .where(eq(applicationsTable.id, params.data.id))
    .limit(1);

  if (!row.application) {
    res.status(404).json({ error: "Candidatura não encontrada" });
    return;
  }

  // Hospital owning the shift can update the application
  if (row.shift && row.shift.hospitalId !== req.session.userId) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const updateData: Partial<typeof applicationsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status as "PENDENTE" | "SELECIONADO" | "REJEITADO";
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [updated] = await db
    .update(applicationsTable)
    .set(updateData)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.doctorId)).limit(1);

  res.json({
    id: updated.id,
    shiftId: updated.shiftId,
    doctorId: updated.doctorId,
    doctorName: doctor?.name ?? null,
    doctorSpecialty: doctor?.specialty ?? null,
    doctorCrm: doctor?.crmNumber ?? null,
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
