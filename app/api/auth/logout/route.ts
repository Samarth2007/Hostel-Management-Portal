import { cookies } from "next/headers";
import { route } from "@/lib/api";
export const POST = route(null, async () => { cookies().delete("sid"); return { ok: true }; });
