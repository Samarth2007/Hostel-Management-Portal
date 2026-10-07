# HostelOS — hostel operations platform
Next.js 14 · TypeScript · Tailwind · PostgreSQL (Prisma) · Razorpay webhooks

## Deploy on Vercel
1. Create a Postgres database (Neon / Vercel Postgres / Supabase) and copy its connection string.
2. Push this folder to GitHub, import it in Vercel, and set env vars from `.env.example`
   (`DATABASE_URL`, `AUTH_SECRET`, and the three `RAZORPAY_*` values).
3. From your machine, with `DATABASE_URL` set: `npm install && npm run db:setup && npm run db:seed`.
4. In Razorpay dashboard add webhook `https://YOUR-DOMAIN/api/payments/webhook` (events: payment.captured, payment.failed) with the same secret as `RAZORPAY_WEBHOOK_SECRET`.
5. `npm test` runs the unit tests.
Demo accounts (seed only, password `Demo@1234`): student1@demo.edu, warden1@demo.edu, staff1@demo.edu, admin@demo.edu.

## Built vs. not yet built
Built: auth + sessions, RBAC (middleware + per-route + row scope), 3-hostel seed (384 beds, 300 students), hostel map, allocation with
recommendations and DB-enforced no-double-booking, complaint workflow, fees + Razorpay order/webhook (signed, idempotent), notifications, audit log, analytics dashboard.
Not built yet: email delivery, attendance, leave, visitors, mess, inventory, notices, SOS, file uploads, PDF/CSV reports, forecasting, Playwright E2E, password reset/email verification.
