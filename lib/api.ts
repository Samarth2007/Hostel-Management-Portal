import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Role } from "@prisma/client";
import { getSession, Session } from "./auth";
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
export const STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "WARDEN"];
// Every API route goes through here: authentication, role check, uniform errors (no stack traces leak).
export const route = (roles: Role[] | null, fn: (req: Request, s: Session, ctx: any) => Promise<unknown>) => async (req: Request, ctx: any) => {
  try {
    const s = await getSession();
    if (roles) { if (!s) throw new HttpError(401, "Please sign in"); if (!roles.includes(s.role)) throw new HttpError(403, "You are not allowed to do this"); }
    return NextResponse.json(await fn(req, s as Session, ctx));
  } catch (e: any) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 422 });
    if (e?.code === "P2002") return NextResponse.json({ error: "Conflict: that record already exists or the bed is taken" }, { status: 409 });
    console.error(e); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
};
