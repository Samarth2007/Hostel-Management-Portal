import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/Forms";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession(); if (!s) redirect("/login");
  const [u, unread] = await Promise.all([db.user.findUnique({ where: { id: s.uid } }), db.notification.count({ where: { userId: s.uid, readAt: null } })]);
  if (!u || u.deletedAt) redirect("/login");
  const staff = ["SUPER_ADMIN", "ADMIN", "WARDEN"].includes(s.role);
  return <div className="mx-auto max-w-6xl px-4 py-5">
    <header className="card mb-5 flex flex-wrap items-center justify-between gap-3 !py-3">
      <nav className="flex items-center gap-1 text-sm font-medium"><span className="mr-3 text-lg font-bold text-iris">HostelOS</span>
        <Link className="rounded-full px-3 py-1 hover:bg-iris/10" href="/dashboard">Dashboard{unread ? <span className="badge ml-1 bg-coral text-white">{unread}</span> : null}</Link>
        {staff && <Link className="rounded-full px-3 py-1 hover:bg-iris/10" href="/hostel">Hostel map</Link>}
        <Link className="rounded-full px-3 py-1 hover:bg-iris/10" href="/complaints">Complaints</Link></nav>
      <div className="flex items-center gap-3 text-sm"><span>{u.name} <span className="badge bg-mint/20 text-emerald-700">{s.role.replace("_", " ")}</span></span><LogoutButton /></div></header>{children}</div>;
}
