import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { complaintScope } from "@/lib/queries";
import { NEXT } from "@/lib/rules";
import { ComplaintActions, ComplaintForm } from "@/components/Forms";
const tone: Record<string, string> = { NEW: "bg-sky-100 text-sky-800", ASSIGNED: "bg-violet-100 text-violet-800", IN_PROGRESS: "bg-amber-100 text-amber-800", WAITING: "bg-orange-100 text-orange-800", RESOLVED: "bg-emerald-100 text-emerald-800", CLOSED: "bg-slate-100 text-slate-700" };
export default async function Complaints() {
  const s = (await getSession())!, isStaff = ["SUPER_ADMIN", "ADMIN", "WARDEN"].includes(s.role);
  const [list, staff] = await Promise.all([db.complaint.findMany({ where: complaintScope(s), orderBy: { createdAt: "desc" }, take: 40, include: { student: { select: { name: true } }, assignee: { select: { name: true } } } }),
    isStaff ? db.user.findMany({ where: { role: "MAINTENANCE", deletedAt: null }, select: { id: true, name: true } }) : []]);
  return <div className="space-y-4">{s.role === "STUDENT" && <div className="card"><h2 className="mb-3 font-semibold">Raise a complaint</h2><ComplaintForm /></div>}
    <div className="card"><h2 className="mb-2 font-semibold">{s.role === "MAINTENANCE" ? "My tasks" : "Tickets"}</h2>
      {list.length ? list.map((c) => <div key={c.id} className="space-y-2 border-t border-iris/10 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2"><b>#{c.ticket}</b><span className={`badge ${tone[c.status]}`}>{c.status.replace("_", " ")}</span><span className="badge bg-iris/10 text-iris">{c.category}</span>
          <span className={`badge ${c.priority === "HIGH" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{c.priority}</span><span className="text-ink/50">{c.student.name} · {c.createdAt.toLocaleDateString("en-IN")}{c.assignee ? ` · ${c.assignee.name}` : ""}</span></div>
        <p className="text-ink/70">{c.description}</p>
        <ComplaintActions id={c.id} staff={staff} canAssign={isStaff && (c.status === "NEW" || c.status === "ASSIGNED")} canRate={s.role === "STUDENT" && ["RESOLVED", "CLOSED"].includes(c.status) && !c.rating}
          next={s.role === "STUDENT" ? [] : NEXT[c.status].filter((n) => n !== "ASSIGNED" && (s.role !== "MAINTENANCE" || n !== "CLOSED"))} />{c.rating ? <p className="text-xs text-amber-600">Rated {c.rating}★</p> : null}</div>) : <p className="text-sm text-ink/50">Nothing here yet.</p>}</div></div>;
}
