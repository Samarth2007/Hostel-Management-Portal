import { Prisma } from "@prisma/client";
import { db } from "./db";
type Tx = Prisma.TransactionClient | typeof db;
export const notify = (tx: Tx, userId: string, title: string, body: string) => tx.notification.create({ data: { userId, title, body } });
export const audit = (tx: Tx, actorId: string | null, action: string, entity: string, entityId?: string, meta?: object) =>
  tx.auditLog.create({ data: { actorId, action, entity, entityId, meta: meta as Prisma.InputJsonValue } });
