import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { updateTenantSchema } from "@/lib/schemas/tenant.schema";
import {
  fail,
  ok,
  parseJson,
  requireSystemAdmin,
  shapeTenant,
} from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ tenantId: string }> };

async function loadTenant(id: string) {
  return prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: { administrators: { take: 1, orderBy: { createdAt: "asc" } } },
  });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;
  const { tenantId } = await ctx.params;
  const tenant = await loadTenant(tenantId);
  if (!tenant) return fail(404, "Tenant not found");
  return ok(shapeTenant(tenant as never));
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;
  const { tenantId } = await ctx.params;
  const existing = await loadTenant(tenantId);
  if (!existing) return fail(404, "Tenant not found");

  const parsed = await parseJson(req, updateTenantSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const admin = existing.administrators[0];
  if (admin && admin.email !== input.administrator.email) {
    const emailConflict = await prisma.user.findFirst({
      where: { email: input.administrator.email, NOT: { id: admin.id } },
    });
    if (emailConflict) {
      return fail(409, "Conflict", { "administrator.email": "Email already exists" });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        cooperativeName: input.cooperativeName,
        cooperativeAddress: input.cooperativeAddress,
      },
    });
    if (admin) {
      await tx.user.update({
        where: { id: admin.id },
        data: {
          firstName: input.administrator.firstName,
          lastName: input.administrator.lastName,
          email: input.administrator.email,
          mobileNumber: input.administrator.mobileNumber || null,
        },
      });
    }
    return tx.tenant.findUnique({
      where: { id: tenantId },
      include: { administrators: { take: 1, orderBy: { createdAt: "asc" } } },
    });
  });

  await writeAuditLog({
    entityType: "Tenant",
    entityId: tenantId,
    action: "UPDATE",
    performedBy: guard.userId,
    changes: {
      before: {
        cooperativeName: existing.cooperativeName,
        cooperativeAddress: existing.cooperativeAddress,
        administrator: admin
          ? {
              firstName: admin.firstName,
              lastName: admin.lastName,
              email: admin.email,
              mobileNumber: admin.mobileNumber,
            }
          : null,
      },
      after: {
        cooperativeName: input.cooperativeName,
        cooperativeAddress: input.cooperativeAddress,
        administrator: input.administrator,
      },
    },
  });

  return ok(shapeTenant(updated as never));
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;
  const { tenantId } = await ctx.params;
  const existing = await loadTenant(tenantId);
  if (!existing) return fail(404, "Tenant not found");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "INACTIVE", deletedAt: new Date() },
  });

  await writeAuditLog({
    entityType: "Tenant",
    entityId: tenantId,
    action: "DELETE",
    performedBy: guard.userId,
    changes: { softDelete: true },
  });

  return ok({ id: tenantId, deleted: true });
}
