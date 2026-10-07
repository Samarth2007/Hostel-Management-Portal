import { createHmac, timingSafeEqual } from "crypto";
export const NEXT: Record<string, string[]> = { NEW: ["ASSIGNED"], ASSIGNED: ["ASSIGNED", "IN_PROGRESS"], IN_PROGRESS: ["WAITING", "RESOLVED"], WAITING: ["IN_PROGRESS"], RESOLVED: ["CLOSED", "IN_PROGRESS"], CLOSED: [] };
export const canMove = (from: string, to: string) => NEXT[from]?.includes(to) ?? false;
export const genderOk = (g: string | null, type: string) => type === "Co-ed" || (type === "Boys" && g === "M") || (type === "Girls" && g === "F");
export function verifySig(body: string, sig: string, secret: string) {
  const h = createHmac("sha256", secret).update(body).digest("hex");
  return sig.length === h.length && timingSafeEqual(Buffer.from(h), Buffer.from(sig));
}
