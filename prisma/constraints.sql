-- Business rules enforced by PostgreSQL itself (Prisma cannot express partial indexes)
CREATE UNIQUE INDEX IF NOT EXISTS one_active_alloc_per_bed ON "Allocation"("bedId") WHERE "endedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_alloc_per_student ON "Allocation"("studentId") WHERE "endedAt" IS NULL;
ALTER TABLE "Fee" DROP CONSTRAINT IF EXISTS fee_amount_positive;
ALTER TABLE "Fee" ADD CONSTRAINT fee_amount_positive CHECK (amount > 0);
ALTER TABLE "Complaint" DROP CONSTRAINT IF EXISTS rating_range;
ALTER TABLE "Complaint" ADD CONSTRAINT rating_range CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);
