// DEMO DATA ONLY: every account uses @demo.edu and password Demo@1234. Names are generated, not real people.
import { PrismaClient, CStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
const M = ["Aarav","Vivaan","Arjun","Rohan","Kabir","Aditya","Ishaan","Rahul","Karan","Yash","Pranav","Harsh","Nikhil","Dev"], F = ["Ananya","Diya","Isha","Kavya","Meera","Neha","Priya","Riya","Saanvi","Sneha","Tanvi","Aditi","Pooja","Shruti"];
const L = ["Sharma","Verma","Gupta","Patil","Joshi","Kulkarni","Mehta","Shah","Iyer","Nair","Reddy","Singh","Khan","Desai"];
const CATS = ["Electrical","Plumbing","Internet","Cleaning","Furniture","Mess","Security","Other"], pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
async function main() {
  for (const m of ["notification","auditLog","paymentEvent","complaint","fee","allocation","bed","room","user","hostel"] as const) await (db[m] as any).deleteMany();
  const ph = await bcrypt.hash("Demo@1234", 10);
  const H = [["Aryabhatta Boys Hostel","Boys"],["Saraswati Girls Hostel","Girls"],["Gandhi Boys Hostel","Boys"]];
  const users: any[] = [], rooms: any[] = [], beds: any[] = [], allocs: any[] = [], fees: any[] = [];
  const u = (id: string, name: string, role: string, extra = {}) => users.push({ id, email: `${id}@demo.edu`, name, passwordHash: ph, role, ...extra });
  u("admin", "Demo Administrator", "ADMIN"); u("super", "Demo Super Admin", "SUPER_ADMIN"); u("mess", "Demo Mess Manager", "MESS");
  for (let i = 1; i <= 3; i++) u("staff" + i, `Maintenance Staff ${i}`, "MAINTENANCE");
  let sn = 0; const students: string[] = [];
  for (let h = 0; h < 3; h++) {
    const hid = "h" + h; await db.hostel.create({ data: { id: hid, name: H[h][0], type: H[h][1] } });
    u("warden" + (h + 1), `Warden ${H[h][0].split(" ")[0]}`, "WARDEN", { hostelId: hid });
    const free: string[] = [];
    for (let f = 1; f <= 4; f++) for (let r = 1; r <= 8; r++) {
      const rid = `r${h}_${f}${r}`; rooms.push({ id: rid, hostelId: hid, floor: f, number: `${f}0${r}`, capacity: 4, maintenance: (f + r + h) % 23 === 0, monthlyFee: 4500 });
      for (const l of "ABCD") { beds.push({ id: `${rid}${l}`, roomId: rid, label: l }); if ((f + r + h) % 23 !== 0) free.push(`${rid}${l}`); }
    }
    for (let k = 0; k < 100; k++) {
      sn++; const g = H[h][1] === "Girls" ? "F" : "M", sid = "student" + sn; students.push(sid);
      u(sid, `${pick(g === "F" ? F : M)} ${pick(L)}`, "STUDENT", { gender: g, code: "DEMO" + (1000 + sn) });
      allocs.push({ bedId: free[k], studentId: sid, startedAt: new Date("2026-07-01") });
      fees.push({ studentId: sid, title: "Hostel fee – Semester 1", amount: 54000, dueDate: new Date(Math.random() < .5 ? "2026-08-15" : "2026-11-15"), ...(Math.random() < .65 ? { status: "PAID", paidAt: new Date("2026-08-01") } : {}) });
    }
  }
  await db.user.createMany({ data: users }); await db.room.createMany({ data: rooms }); await db.bed.createMany({ data: beds });
  await db.allocation.createMany({ data: allocs }); await db.fee.createMany({ data: fees });
  const cs = Array.from({ length: 70 }, (_, i) => { const st = pick<CStatus>(["NEW","ASSIGNED","IN_PROGRESS","RESOLVED","RESOLVED","CLOSED"]);
    const done = st === "RESOLVED" || st === "CLOSED", asg = st !== "NEW", created = new Date(Date.now() - Math.random() * 60 * 864e5);
    return { studentId: pick(students), category: pick(CATS), priority: pick(["LOW","MEDIUM","HIGH"]), description: "Demo complaint: please check and fix this issue in the room.", status: st,
      assigneeId: asg ? "staff" + (1 + (i % 3)) : null, createdAt: created, resolvedAt: done ? new Date(created.getTime() + Math.random() * 4 * 864e5) : null }; });
  await db.complaint.createMany({ data: cs });
  await db.auditLog.create({ data: { action: "SEED", entity: "System", meta: { note: "Demo data loaded" } } });
  console.log("Seeded. Login: student1@demo.edu / warden1@demo.edu / staff1@demo.edu / admin@demo.edu  (password Demo@1234)");
}
main().finally(() => db.$disconnect());
