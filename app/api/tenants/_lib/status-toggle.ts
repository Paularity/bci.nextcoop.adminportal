import { NextRequest } from "next/server";
import { TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fail, ok, requireSystemAdmin, shapeTenant } from "@/lib/api-helpers";
import { writeAuditLog, type AuditAction } from "@/lib/audit";
import {
  findActiveTenantById,
  findTenantByIdOrThrow,
} from "@/lib/repositories/tenant.repository";

type Ctx = { params: Promise<{ tenantId: string }> };

/**
 * Handle POST for the activate / deactivate endpoints. They're identical apart
 * from the target status and the audit action name — so we parametrise both.
 * Idempotent: if the tenant is already in the target state, return the current
 * shape without a write or audit row.
 */
export function makeStatusTogglePOST(opts: {
  target: TenantStatus;
  audit: AuditAction;
}) {
  return async function POST(_req: NextRequest, ctx: Ctx) {
    const guard = await requireSystemAdmin();
    if ("error" in guard) return guard.error;
    const { tenantId } = await ctx.params;

    const existing = await findActiveTenantById(tenantId);
    if (!existing) return fail(404, "Tenant not found");

    if (existing.status === opts.target) return ok(shapeTenant(existing));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: opts.target },
      });
      await writeAuditLog(
        {
          entityType: "Tenant",
          entityId: tenantId,
          action: opts.audit,
          performedBy: guard.userId,
          changes: { from: existing.status, to: opts.target },
        },
        tx,
      );
      return findTenantByIdOrThrow(tenantId, tx);
    });

    return ok(shapeTenant(updated));
  };
}
