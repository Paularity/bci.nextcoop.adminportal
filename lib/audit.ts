import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AuditAction = "CREATE" | "UPDATE" | "ACTIVATE" | "DEACTIVATE" | "DELETE";

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export async function writeAuditLog(
  params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    performedBy: string;
    changes?: Record<string, unknown> | null;
  },
  client: PrismaClientLike = prisma
) {
  await client.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      performedBy: params.performedBy,
      changes: params.changes ? JSON.stringify(params.changes) : null,
    },
  });
}
