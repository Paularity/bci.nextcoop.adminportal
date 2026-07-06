import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, requireSystemAdmin, shapeTenant } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ tenantId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;
  const { tenantId } = await ctx.params;

  const existing = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!existing) return fail(404, "Tenant not found");

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "INACTIVE" },
    include: { administrators: { take: 1, orderBy: { createdAt: "asc" } } },
  });

  await writeAuditLog({
    entityType: "Tenant",
    entityId: tenantId,
    action: "DEACTIVATE",
    performedBy: guard.userId,
    changes: { from: existing.status, to: "INACTIVE" },
  });

  return ok(shapeTenant(updated as never));
}
