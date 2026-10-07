import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STAFF } from "@/lib/api";
import { AllocateForm } from "@/components/Forms";
export default async function Hostel() {
  const s = (await getSession())!; if (!STAFF.includes(s.role)) redirect("/dashboard");
  const hs = await db.hostel.findMany({ where: s.role === "WARDEN" ? { id: s.hostelId ?? "none" } : {}, orderBy: { name: "asc" },
    include: { rooms: { orderBy: [{ floor: "asc" }, { number: "asc" }], include: { beds: { orderBy: { label: "asc" }, include: { allocations: { where: { endedAt: null }, include: { student: { select: { name: true, code: true } } } } } } } } } });
  return <div className="space-y-6">{hs.map((h) => <section key={h.id} className="card"><h2 className="text-xl font-bold">{h.name}</h2>
    {[...new Set(h.rooms.map((r) => r.floor))].map((f) => <div key={f} className="mt-4"><p className="mb-2 text-sm font-semibold text-ink/60">Floor {f}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {h.rooms.filter((r) => r.floor === f).map((r) => { const occ = r.beds.filter((b) => b.allocations.length).length, full = occ >= r.beds.length;
        const tone = r.maintenance ? "bg-sky-100 text-sky-800" : full ? "bg-rose-100 text-rose-800" : occ ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
        return <details key={r.id} className="group"><summary className={`list-none cursor-pointer rounded-2xl px-3 py-2 text-center text-sm font-semibold transition hover:scale-105 ${tone}`}>{r.number}<br /><span className="text-xs font-normal">{r.maintenance ? "Maintenance" : `${occ}/${r.beds.length}`}</span></summary>
          <div className="absolute z-10 mt-1 w-72 rounded-2xl border border-iris/20 bg-white p-3 text-sm shadow-xl"><p className="font-semibold">Room {r.number} · ₹{r.monthlyFee}/month</p>
            {r.beds.map((b) => <div key={b.id} className="mt-1 border-t border-iris/10 pt-1">Bed {b.label}: {b.allocations[0] ? `${b.allocations[0].student.name} (${b.allocations[0].student.code})` : r.maintenance ? "unavailable" : <AllocateForm bedId={b.id} />}</div>)}</div></details>; })}</div></div>)}</section>)}
    <p className="text-sm text-ink/60">🟢 free · 🟡 partly occupied · 🔴 full · 🔵 maintenance. Click a room for beds and allocation.</p></div>;
}
