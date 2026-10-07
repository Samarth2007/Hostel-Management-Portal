import { z } from "zod";
import { db } from "@/lib/db";
import { route, HttpError } from "@/lib/api";
import { audit, notify } from "@/lib/notify";
export const POST = route(["STUDENT"], async (req, s) => {
  const b = z.object({ category: z.enum(["Electrical", "Plumbing", "Internet", "Cleaning", "Furniture", "Mess", "Security", "Other"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]), description: z.string().trim().min(10, "Please describe the problem (10+ characters)").max(1000) }).parse(await req.json());
  const dup = await db.complaint.findFirst({ where: { studentId: s.uid, description: b.description, createdAt: { gt: new Date(Date.now() - 120000) } } });
  if (dup) return { ticket: dup.ticket, duplicate: true }; // double-submit protection
  const alloc = await db.allocation.findFirst({ where: { studentId: s.uid, endedAt: null }, include: { bed: { include: { room: true } } } });
  if (!alloc) throw new HttpError(409, "You need a room allocation before raising a complaint");
  return db.$transaction(async (tx) => {
    const c = await tx.complaint.create({ data: { ...b, studentId: s.uid } });
    const wardens = await tx.user.findMany({ where: { role: "WARDEN", hostelId: alloc.bed.room.hostelId, deletedAt: null } });
    for (const w of wardens) await notify(tx, w.id, `New complaint #${c.ticket}`, `${b.category} (${b.priority}) in room ${alloc.bed.room.number}`);
    await audit(tx, s.uid, "COMPLAINT_CREATE", "Complaint", c.id);
    return { ticket: c.ticket };
  });
});
