import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { route, HttpError } from "@/lib/api";
import { audit } from "@/lib/notify";
const tries = new Map<string, { n: number; t: number }>(); // per-instance limiter; use Upstash/Redis for multi-instance production
export const POST = route(null, async (req) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(await req.json());
  const k = email.toLowerCase(), r = tries.get(k), fresh = r && Date.now() - r.t < 600000;
  if (fresh && r.n >= 5) throw new HttpError(429, "Too many attempts. Try again in 10 minutes.");
  const u = await db.user.findFirst({ where: { email: k, deletedAt: null } });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    tries.set(k, { n: (fresh ? r.n : 0) + 1, t: Date.now() });
    throw new HttpError(401, "Invalid email or password");
  }
  tries.delete(k);
  await createSession({ uid: u.id, role: u.role, hostelId: u.hostelId });
  await audit(db, u.id, "LOGIN", "User", u.id);
  return { ok: true };
});
