import { z } from "zod";
import { db } from "@/lib/db";
import { route, HttpError, STAFF } from "@/lib/api";
import { genderOk } from "@/lib/rules";
import { audit, notify } from "@/lib/notify";
// Smart recommendation: suggests rooms with reasons. Humans still confirm the allocation.
export const GET = route(STAFF, async (req, s) => {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const st = await db.user.findFirst({ where: { code, role: "STUDENT", deletedAt: null }, include: { allocations: { where: { endedAt: null } } } });
  if (!st) throw new HttpError(404, "Student not found");
  if (st.allocations.length) throw new HttpError(409, "Student already has an active allocation");
  const rooms = await db.room.findMany({ where: { maintenance: false, ...(s.role === "WARDEN" ? { hostelId: s.hostelId ?? "none" } : {}) },
    include: { hostel: true, beds: { include: { allocations: { where: { endedAt: null } } } } } });
  return rooms.filter((r) => genderOk(st.gender, r.hostel.type)).map((r) => {
    const free = r.beds.filter((b) => !b.allocations.length), occ = r.beds.length - free.length;
    const reasons = [`${r.hostel.name} accepts ${r.hostel.type.toLowerCase()} students`, `${free.length} of ${r.beds.length} beds free`];
    if (occ > 0) reasons.push("Fills a partly occupied room before opening a new one");
    return { roomId: r.id, room: `${r.hostel.name} · ${r.number}`, bedId: free[0]?.id, free: free.length, score: occ > 0 ? 10 + occ : 1, reasons };
  }).filter((x) => x.free > 0).sort((a, b) => b.score - a.score).slice(0, 5);
});
export const POST = route(STAFF, async (req, s) => {
  const { code, bedId } = z.object({ code: z.string().min(1), bedId: z.string().min(1) }).parse(await req.json());
  return db.$transaction(async (tx) => {
    const st = await tx.user.findFirst({ where: { code, role: "STUDENT", deletedAt: null } });
    const bed = await tx.bed.findUnique({ where: { id: bedId }, include: { room: { include: { hostel: true } } } });
    if (!st || !bed) throw new HttpError(404, "Student or bed not found");
    if (s.role === "WARDEN" && bed.room.hostelId !== s.hostelId) throw new HttpError(403, "That bed is outside your hostel");
    if (bed.room.maintenance) throw new HttpError(409, "Room is under maintenance");
    if (!genderOk(st.gender, bed.room.hostel.type)) throw new HttpError(422, "Hostel type does not match the student");
    // Partial unique indexes in Postgres guarantee no double-booking even under concurrent requests (-> 409).
    const a = await tx.allocation.create({ data: { bedId, studentId: st.id, byId: s.uid } });
    await notify(tx, st.id, "Room allocated", `You have been allocated room ${bed.room.number}, bed ${bed.label} in ${bed.room.hostel.name}.`);
    await audit(tx, s.uid, "ALLOCATE", "Allocation", a.id, { student: code, bedId });
    return { ok: true };
  });
});
