import type { Session } from "./auth";
// Row-level scope: who may see which complaints. Used by pages AND the PATCH API (prevents IDOR).
export function complaintScope(s: Session) {
  if (s.role === "STUDENT") return { studentId: s.uid };
  if (s.role === "MAINTENANCE") return { assigneeId: s.uid };
  if (s.role === "WARDEN") return { student: { allocations: { some: { endedAt: null, bed: { room: { hostelId: s.hostelId ?? "none" } } } } } };
  if (s.role === "ADMIN" || s.role === "SUPER_ADMIN") return {};
  return { id: "none" };
}
