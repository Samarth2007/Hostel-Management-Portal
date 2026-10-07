import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySig } from "@/lib/rules";
import { audit, notify } from "@/lib/notify";
// Payment status is decided ONLY here, after verifying the provider's signature. Duplicate events are ignored.
export async function POST(req: Request) {
  const raw = await req.text(), sig = req.headers.get("x-razorpay-signature") ?? "", secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !verifySig(raw, sig, secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const ev = JSON.parse(raw), eventId = req.headers.get("x-razorpay-event-id") ?? "", p = ev?.payload?.payment?.entity;
  if (!eventId || !p?.order_id) return NextResponse.json({ ok: true });
  const fee = await db.fee.findUnique({ where: { orderId: p.order_id } });
  if (!fee) return NextResponse.json({ ok: true });
  try {
    await db.$transaction(async (tx) => {
      await tx.paymentEvent.create({ data: { eventId, feeId: fee.id, type: ev.event } }); // unique(eventId) -> replay throws P2002
      if (ev.event === "payment.captured" && p.amount === fee.amount * 100) {
        await tx.fee.update({ where: { id: fee.id }, data: { status: "PAID", paidAt: new Date() } });
        await notify(tx, fee.studentId, "Payment successful", `₹${fee.amount} received for ${fee.title}.`);
      } else if (ev.event === "payment.failed") await notify(tx, fee.studentId, "Payment failed", `Your payment for ${fee.title} did not go through. Please retry.`);
      await audit(tx, null, "PAYMENT_" + String(ev.event).toUpperCase(), "Fee", fee.id, { eventId });
    });
  } catch (e: any) { if (e?.code !== "P2002") return NextResponse.json({ error: "retry" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
