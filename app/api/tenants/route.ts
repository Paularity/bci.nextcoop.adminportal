import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  createTenantSchema,
  listTenantsQuerySchema,
} from "@/lib/schemas/tenant.schema";
import {
  fail,
  ok,
  parseJson,
  requireSystemAdmin,
  shapeTenant,
  zodToFields,
} from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const parsed = listTenantsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return fail(400, "Invalid query", zodToFields(parsed.error));
  const { q, status, page, pageSize, sort, order } = parsed.data;

  const where: Prisma.TenantWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { tenantCode: { contains: q } },
            { cooperativeName: { contains: q } },
            { cooperativeAddress: { contains: q } },
            { administrators: { some: { OR: [
              { email: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { username: { contains: q } },
            ] } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { administrators: { take: 1, orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return ok({
    data: rows.map((r) => shapeTenant(r as never)),
    total,
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const parsed = await parseJson(req, createTenantSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  const [codeConflict, userConflict, emailConflict] = await Promise.all([
    prisma.tenant.findUnique({ where: { tenantCode: input.tenantCode } }),
    prisma.user.findUnique({ where: { username: input.administrator.username } }),
    prisma.user.findUnique({ where: { email: input.administrator.email } }),
  ]);

  const conflictFields: Record<string, string> = {};
  if (codeConflict) {
    conflictFields["tenantCode"] = codeConflict.deletedAt
      ? "Tenant code was used by a previously deleted tenant. Pick a different code."
      : "Tenant code already exists";
  }
  if (userConflict) conflictFields["administrator.username"] = "Username already exists";
  if (emailConflict) conflictFields["administrator.email"] = "Email already exists";
  if (Object.keys(conflictFields).length > 0) {
    return fail(409, "Conflict", conflictFields);
  }

  const passwordHash = await bcrypt.hash(input.administrator.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        tenantCode: input.tenantCode,
        cooperativeName: input.cooperativeName,
        cooperativeAddress: input.cooperativeAddress,
      },
    });
    await tx.user.create({
      data: {
        username: input.administrator.username,
        email: input.administrator.email,
        firstName: input.administrator.firstName,
        lastName: input.administrator.lastName,
        mobileNumber: input.administrator.mobileNumber || null,
        passwordHash,
        role: "TENANT_ADMIN",
        tenantId: tenant.id,
      },
    });
    return tx.tenant.findUnique({
      where: { id: tenant.id },
      include: { administrators: { take: 1, orderBy: { createdAt: "asc" } } },
    });
  });

  if (created) {
    await writeAuditLog({
      entityType: "Tenant",
      entityId: created.id,
      action: "CREATE",
      performedBy: guard.userId,
      changes: {
        tenantCode: created.tenantCode,
        cooperativeName: created.cooperativeName,
      },
    });
  }

  return ok(shapeTenant(created as never), 201);
}
