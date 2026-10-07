import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
export type Session = { uid: string; role: Role; hostelId: string | null };
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);
export async function createSession(s: Session) {
  const t = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("8h").sign(key());
  cookies().set("sid", t, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 28800 });
}
export async function getSession(): Promise<Session | null> {
  const t = cookies().get("sid")?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return { uid: payload.uid as string, role: payload.role as Role, hostelId: (payload.hostelId as string) ?? null }; }
  catch { return null; }
}
