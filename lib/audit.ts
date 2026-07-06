import { prisma } from "@/lib/db";

export type AuditAction = "CREATE" | "UPDATE" | "ACTIVATE" | "DEACTIVATE" | "DELETE";

export async function writeAuditLog(params: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedBy: string;
  changes?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      performedBy: params.performedBy,
      changes: params.changes ? JSON.stringify(params.changes) : null,
    },
  });
}
