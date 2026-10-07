import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) {
    // CSRF defence: state-changing requests must come from our own origin (webhook is signature-verified instead)
    const m = req.method;
    if (m !== "GET" && pathname !== "/api/payments/webhook") {
      const o = req.headers.get("origin");
      if (!o || new URL(o).host !== req.nextUrl.host) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
    return NextResponse.next();
  }
  try { await jwtVerify(req.cookies.get("sid")?.value ?? "", new TextEncoder().encode(process.env.AUTH_SECRET)); return NextResponse.next(); }
  catch { return NextResponse.redirect(new URL("/login", req.url)); }
}
export const config = { matcher: ["/api/:path*", "/dashboard/:path*", "/hostel/:path*", "/complaints/:path*"] };
