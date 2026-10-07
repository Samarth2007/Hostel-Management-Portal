import { z } from "zod";
import { db } from "@/lib/db";
import { route, HttpError } from "@/lib/api";
export const POST = route(["STUDENT"], async (req, s) => {
  const { feeId } = z.object({ feeId: z.string() }).parse(await req.json());
  const fee = await db.fee.findFirst({ where: { id: feeId, studentId: s.uid, status: "PENDING" } });
  if (!fee) throw new HttpError(404, "Fee not found or already paid");
  const id = process.env.RAZORPAY_KEY_ID, sec = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !sec) throw new HttpError(503, "Payments are not configured yet");
  const r = await fetch("https://api.razorpay.com/v1/orders", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${id}:${sec}`).toString("base64") },
    body: JSON.stringify({ amount: fee.amount * 100, currency: "INR", receipt: fee.id }) });
  if (!r.ok) throw new HttpError(502, "Payment provider error");
  const o = await r.json();
  await db.fee.update({ where: { id: fee.id }, data: { orderId: o.id } });
  return { orderId: o.id, amount: o.amount, key: id }; // the amount always comes from OUR database, never the browser
});
