"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
async function call(url: string, method: string, body?: unknown) {
  try { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const j = await r.json().catch(() => ({})); return r.ok ? { ok: true, j } : { ok: false, error: j.error ?? "Request failed" }; }
  catch { return { ok: false, error: "Network problem. Check your connection and try again." }; }
}
const Msg = ({ m }: { m: string }) => m ? <p role="alert" className="text-sm text-rose-600">{m}</p> : null;
export function LoginForm() {
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), r = useRouter();
  return <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const f = new FormData(e.currentTarget);
    const x = await call("/api/auth/login", "POST", { email: f.get("email"), password: f.get("password") }); setBusy(false); x.ok ? (r.push("/dashboard"), r.refresh()) : setErr(x.error!); }}>
    <input className="inp" name="email" type="email" placeholder="Email" required aria-label="Email" />
    <input className="inp" name="password" type="password" placeholder="Password" required aria-label="Password" />
    <Msg m={err} /><button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form>;
}
export function LogoutButton() { const r = useRouter(); return <button className="btn-ghost" onClick={async () => { await call("/api/auth/logout", "POST"); r.push("/login"); r.refresh(); }}>Sign out</button>; }
export function MarkRead() { const r = useRouter(); return <button className="btn-ghost" onClick={async () => { await call("/api/notifications", "PATCH"); r.refresh(); }}>Mark all read</button>; }
export function ComplaintForm() {
  const [err, setErr] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false), r = useRouter();
  return <form className="grid gap-3 sm:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); setOk(""); const f = new FormData(e.currentTarget);
    const x = await call("/api/complaints", "POST", { category: f.get("category"), priority: f.get("priority"), description: f.get("description") }); setBusy(false);
    if (x.ok) { setOk(`Ticket #${x.j.ticket} ${x.j.duplicate ? "already exists" : "created"}`); r.refresh(); } else setErr(x.error!); }}>
    <select name="category" className="inp">{["Electrical","Plumbing","Internet","Cleaning","Furniture","Mess","Security","Other"].map((c) => <option key={c}>{c}</option>)}</select>
    <select name="priority" className="inp" defaultValue="MEDIUM"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
    <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit complaint"}</button>
    <textarea name="description" className="inp sm:col-span-3" rows={2} placeholder="Describe the problem" required aria-label="Description" />
    <div className="sm:col-span-3"><Msg m={err} />{ok && <p className="text-sm text-emerald-600">{ok}</p>}</div></form>;
}
export function ComplaintActions({ id, next, staff, canAssign, canRate }: { id: string; next: string[]; staff: { id: string; name: string }[]; canAssign: boolean; canRate: boolean }) {
  const r = useRouter(), [err, setErr] = useState("");
  const go = async (b: object) => { const x = await call(`/api/complaints/${id}`, "PATCH", b); x.ok ? r.refresh() : setErr(x.error!); };
  return <div className="flex flex-wrap items-center gap-2">
    {canAssign && <select className="inp !w-auto" defaultValue="" onChange={(e) => e.target.value && go({ assigneeId: e.target.value })} aria-label="Assign staff"><option value="">Assign to…</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
    {next.map((n) => <button key={n} className="btn-ghost" onClick={() => go({ status: n })}>{n.replace("_", " ")}</button>)}
    {canRate && [1,2,3,4,5].map((n) => <button key={n} className="btn-ghost" onClick={() => go({ rating: n })} aria-label={`Rate ${n}`}>{n}★</button>)}
    <Msg m={err} /></div>;
}
export function AllocateForm({ bedId }: { bedId: string }) {
  const [err, setErr] = useState(""), r = useRouter();
  return <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const code = new FormData(e.currentTarget).get("code");
    const x = await call("/api/allocations", "POST", { code, bedId }); x.ok ? r.refresh() : setErr(x.error!); }}>
    <input name="code" className="inp" placeholder="Student code e.g. DEMO1001" required aria-label="Student code" /><button className="btn">Allocate</button>{err && <span role="alert" className="text-xs text-rose-600">{err}</span>}</form>;
}
export function PayButton({ feeId }: { feeId: string }) {
  const [err, setErr] = useState("");
  return <><button className="btn" onClick={async () => { const x = await call("/api/payments/order", "POST", { feeId }); if (!x.ok) return setErr(x.error!);
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => new (window as any).Razorpay({ key: x.j.key, order_id: x.j.orderId, amount: x.j.amount, name: "HostelOS", handler: () => setTimeout(() => location.reload(), 3000) }).open(); document.body.appendChild(s); }}>Pay now</button><Msg m={err} /></>;
}
