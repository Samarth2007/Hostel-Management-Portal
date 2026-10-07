import { z } from "zod";
import { db } from "@/lib/db";
import { route, HttpError, STAFF } from "@/lib/api";
import { canMove } from "@/lib/rules";
import { complaintScope } from "@/lib/queries";
import { audit, notify } from "@/lib/notify";
const B = z.object({ assigneeId: z.string().optional(), status: z.enum(["IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(), rating: z.number().int().min(1).max(5).optional() });
export const PATCH = route(["STUDENT", "WARDEN", "ADMIN", "SUPER_ADMIN", "MAINTENANCE"], async (req, s, { params }) => {
  const b = B.parse(await req.json());
  const c = await db.complaint.findFirst({ where: { id: params.id, ...complaintScope(s) } }); // scope check = no IDOR
  if (!c) throw new HttpError(404, "Complaint not found");
  return db.$transaction(async (tx) => {
    if (b.assigneeId) {
      if (!STAFF.includes(s.role)) throw new HttpError(403, "Only wardens/admins can assign");
      if (!canMove(c.status, "ASSIGNED")) throw new HttpError(409, `Cannot assign a ${c.status} complaint`);
      const a = await tx.user.findFirst({ where: { id: b.assigneeId, role: "MAINTENANCE", deletedAt: null } });
      if (!a) throw new HttpError(422, "Maintenance staff member not found");
      await tx.complaint.update({ where: { id: c.id }, data: { assigneeId: a.id, status: "ASSIGNED" } });
      await notify(tx, a.id, `Task #${c.ticket} assigned`, "A new maintenance task is waiting for you.");
      await notify(tx, c.studentId, `Complaint #${c.ticket} assigned`, `${a.name} will handle your request.`);
      await audit(tx, s.uid, "COMPLAINT_ASSIGN", "Complaint", c.id, { to: a.id });
    }
    if (b.status) {
      if (s.role === "STUDENT") throw new HttpError(403, "Students cannot change status");
      if (b.status === "CLOSED" && s.role === "MAINTENANCE") throw new HttpError(403, "Only a warden can close a ticket");
      if (!canMove(c.status, b.status)) throw new HttpError(409, `Cannot move ${c.status} -> ${b.status}`);
      await tx.complaint.update({ where: { id: c.id }, data: { status: b.status, resolvedAt: b.status === "RESOLVED" ? new Date() : c.resolvedAt } });
      await notify(tx, c.studentId, `Complaint #${c.ticket} is ${b.status.replace("_", " ").toLowerCase()}`, "Open the Complaints page for details.");
      await audit(tx, s.uid, "COMPLAINT_STATUS", "Complaint", c.id, { from: c.status, to: b.status });
    }
    if (b.rating) {
      if (s.role !== "STUDENT" || !["RESOLVED", "CLOSED"].includes(c.status)) throw new HttpError(409, "You can rate only your resolved complaints");
      await tx.complaint.update({ where: { id: c.id }, data: { rating: b.rating } });
    }
    return { ok: true };
  });
});
