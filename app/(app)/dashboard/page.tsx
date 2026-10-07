import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Categories, Occupancy } from "@/components/Charts";
import { MarkRead, PayButton } from "@/components/Forms";
const Kpi = ({ l, v, c }: { l: string; v: string | number; c: string }) => <div className="card"><p className="text-sm text-ink/60">{l}</p><p className={`mt-1 text-3xl font-bold ${c}`}>{v}</p></div>;
export default async function Dashboard() {
  const s = (await getSession())!;
  const notes = await db.notification.findMany({ where: { userId: s.uid }, orderBy: { createdAt: "desc" }, take: 6 });
  const Notes = <div className="card"><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Notifications</h2>{notes.some((n) => !n.readAt) && <MarkRead />}</div>
    {notes.length ? notes.map((n) => <div key={n.id} className={`border-t border-iris/10 py-2 text-sm ${n.readAt ? "opacity-60" : ""}`}><b>{n.title}</b><p className="text-ink/60">{n.body}</p></div>) : <p className="text-sm text-ink/50">You are all caught up.</p>}</div>;
  if (s.role === "STUDENT") {
    const [al, fees, cs] = await Promise.all([
      db.allocation.findFirst({ where: { studentId: s.uid, endedAt: null }, include: { bed: { include: { room: { include: { hostel: true } } } } } }),
      db.fee.findMany({ where: { studentId: s.uid }, orderBy: { dueDate: "asc" } }), db.complaint.count({ where: { studentId: s.uid, status: { notIn: ["RESOLVED", "CLOSED"] } } })]);
    const mates = al ? await db.allocation.findMany({ where: { endedAt: null, bed: { roomId: al.bed.roomId }, NOT: { studentId: s.uid } }, include: { student: { select: { name: true } } } }) : [];
    return <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><h2 className="font-semibold">My room</h2>{al ? <><p className="mt-2 text-3xl font-bold text-iris">{al.bed.room.number}</p><p className="text-sm text-ink/60">{al.bed.room.hostel.name} · Floor {al.bed.room.floor} · Bed {al.bed.label}</p>
        <p className="mt-3 text-sm">Roommates: {mates.length ? mates.map((m) => m.student.name).join(", ") : "none yet"}</p></> : <p className="mt-2 text-sm text-ink/60">No room allocated yet. Your warden will assign one.</p>}</div>
      <div className="card"><h2 className="font-semibold">Fees</h2>{fees.length ? fees.map((f) => <div key={f.id} className="mt-2 flex items-center justify-between gap-2 text-sm"><span>{f.title}<br /><span className="text-ink/50">₹{f.amount} · due {f.dueDate.toDateString()}</span></span>
        {f.status === "PAID" ? <span className="badge bg-mint/20 text-emerald-700">Paid</span> : <PayButton feeId={f.id} />}</div>) : <p className="mt-2 text-sm text-ink/60">No fees yet.</p>}</div>
      <Kpi l="Open complaints" v={cs} c="text-coral" />{Notes}</div>;
  }
  if (s.role === "MAINTENANCE" || s.role === "MESS") return <div className="grid gap-4 md:grid-cols-2">{Notes}</div>;
  const hs = await db.hostel.findMany({ where: s.role === "WARDEN" ? { id: s.hostelId ?? "none" } : {}, orderBy: { name: "asc" } });
  const per = await Promise.all(hs.map(async (h) => { const [b, o] = await Promise.all([db.bed.count({ where: { room: { hostelId: h.id, maintenance: false } } }), db.allocation.count({ where: { endedAt: null, bed: { room: { hostelId: h.id } } } })]); return { name: h.name.split(" ")[0], occupied: o, free: b - o }; }));
  const beds = per.reduce((a, x) => a + x.occupied + x.free, 0), occ = per.reduce((a, x) => a + x.occupied, 0), admin = s.role !== "WARDEN";
  const [open, cats, pend, paid, logs] = await Promise.all([db.complaint.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }), db.complaint.groupBy({ by: ["category"], _count: true }),
    admin ? db.fee.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }) : null, admin ? db.fee.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }) : null, db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 })]);
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Kpi l="Occupancy" v={beds ? Math.round((occ / beds) * 100) + "%" : "0%"} c="text-iris" /><Kpi l="Free beds" v={beds - occ} c="text-mint" /><Kpi l="Open complaints" v={open} c="text-coral" />
    {admin ? <Kpi l="Fees pending" v={"₹" + ((pend?._sum.amount ?? 0) / 100000).toFixed(1) + "L"} c="text-ink" /> : <Kpi l="Students" v={occ} c="text-ink" />}</div>
    <div className="grid gap-4 md:grid-cols-2"><div className="card"><h2 className="font-semibold">Occupancy by hostel</h2><Occupancy data={per} /></div>
      <div className="card"><h2 className="font-semibold">Complaints by category</h2><Categories data={cats.map((c) => ({ name: c.category, count: c._count }))} /></div></div>
    {admin && <p className="text-sm text-ink/60">Collected so far: ₹{((paid?._sum.amount ?? 0) / 100000).toFixed(1)}L</p>}
    <div className="grid gap-4 md:grid-cols-2">{Notes}<div className="card"><h2 className="mb-2 font-semibold">Recent activity (audit log)</h2>{logs.map((l) => <p key={l.id} className="border-t border-iris/10 py-1.5 text-sm">{l.action} <span className="text-ink/50">· {l.entity} · {l.createdAt.toLocaleString("en-IN")}</span></p>)}</div></div></div>;
}
