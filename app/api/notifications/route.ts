import { db } from "@/lib/db";
import { route } from "@/lib/api";
export const PATCH = route(["STUDENT", "WARDEN", "ADMIN", "SUPER_ADMIN", "MAINTENANCE", "MESS"], async (_r, s) => {
  await db.notification.updateMany({ where: { userId: s.uid, readAt: null }, data: { readAt: new Date() } }); return { ok: true };
});
