import { NextRequest } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  updateTenantSchema,
  type UpdateTenantInput,
} from "@/lib/schemas/tenant.schema";
import {
  fail,
  handlePrismaKnownError,
  ok,
  parseJson,
  requireSystemAdmin,
  shapeTenant,
} from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import {
  TENANT_UPDATE_CONFLICT_FIELDS,
  findActiveTenantById,
  findTenantByIdOrThrow,
  type TenantWithAdmin,
} from "@/lib/repositories/tenant.repository";

type Ctx = { params: Promise<{ tenantId: string }> };

// ─── GET /api/tenants/[id] ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const { tenantId } = await ctx.params;
  const tenant = await findActiveTenantById(tenantId);
  if (!tenant) return fail(404, "Tenant not found");

  return ok(shapeTenant(tenant));
}

// ─── PUT /api/tenants/[id] ────────────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const { tenantId } = await ctx.params;
  const existing = await findActiveTenantById(tenantId);
  if (!existing) return fail(404, "Tenant not found");

  const body = await parseJson(req, updateTenantSchema);
  if (!body.ok) return body.response;

  const input = body.data;
  const auditChanges = buildTenantUpdateAuditChanges(existing, input);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          cooperativeName: input.cooperativeName,
          cooperativeAddress: input.cooperativeAddress,
        },
      });

      const admin = existing.administrators[0];
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

      await writeAuditLog(
        {
          entityType: "Tenant",
          entityId: tenantId,
          action: "UPDATE",
          performedBy: guard.userId,
          changes: auditChanges,
        },
        tx,
      );

      return findTenantByIdOrThrow(tenantId, tx);
    });

    return ok(shapeTenant(updated));
  } catch (err) {
    const conflict = handlePrismaKnownError(err, TENANT_UPDATE_CONFLICT_FIELDS);
    if (conflict) return conflict;
    throw err;
  }
}

// ─── DELETE /api/tenants/[id] ─────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const { tenantId } = await ctx.params;
  const existing = await findActiveTenantById(tenantId);
  if (!existing) return fail(404, "Tenant not found");

  // Soft delete: mark inactive, stamp deletedAt, and rename tenantCode so the
  // original value is freed for reuse under the `@unique` constraint.
  const originalTenantCode = existing.tenantCode;
  const freedTenantCode = `${originalTenantCode}__deleted-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
        tenantCode: freedTenantCode,
      },
    });
    await writeAuditLog(
      {
        entityType: "Tenant",
        entityId: tenantId,
        action: "DELETE",
        performedBy: guard.userId,
        changes: { softDelete: true, originalTenantCode, freedTenantCode },
      },
      tx,
    );
  });

  return ok({ id: tenantId, deleted: true });
}

// ─── helpers (PUT) ────────────────────────────────────────────────────────────

/** Snapshot the administrator's identifying fields for audit-log diffing. */
function adminSnapshot(admin: User | undefined) {
  if (!admin) return null;
  return {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    mobileNumber: admin.mobileNumber,
  };
}

/** Build a `{ before, after }` diff of what the PUT is about to change. */
function buildTenantUpdateAuditChanges(
  existing: TenantWithAdmin,
  input: UpdateTenantInput,
): Record<string, unknown> {
  return {
    before: {
      cooperativeName: existing.cooperativeName,
      cooperativeAddress: existing.cooperativeAddress,
      administrator: adminSnapshot(existing.administrators[0]),
    },
    after: {
      cooperativeName: input.cooperativeName,
      cooperativeAddress: input.cooperativeAddress,
      administrator: input.administrator,
    },
  };
}
