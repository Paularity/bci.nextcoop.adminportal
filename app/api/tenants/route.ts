import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createTenantSchema,
  listTenantsQuerySchema,
  type CreateTenantInput,
} from "@/lib/schemas/tenant.schema";
import {
  fail,
  handlePrismaKnownError,
  parseJson,
  requireSystemAdmin,
  shapeTenant,
  zodToFields,
} from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import {
  TENANT_CREATE_CONFLICT_FIELDS,
  TENANT_INCLUDE_WITH_ADMIN,
  buildTenantListWhere,
  findTenantByIdOrThrow,
} from "@/lib/repositories/tenant.repository";

// ─── GET /api/tenants ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const query = listTenantsQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  if (!query.success) return fail(400, "Invalid query", zodToFields(query.error));

  const { q, status, page, pageSize, sort, order } = query.data;
  const where = buildTenantListWhere({ q, status });

  // When `pageSize` is omitted, return the entire working set — the client
  // (Kendo Grid) paginates in the browser. When `pageSize` is present, honor
  // classic server-side paging via skip/take.
  const paginated = pageSize !== undefined;

  const [total, rows] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      orderBy: { [sort]: order },
      ...(paginated ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      include: TENANT_INCLUDE_WITH_ADMIN,
    }),
  ]);

  // Canonical `{ data }` = resource; list metadata sits alongside as `meta`
  // to keep AC-API-08's single-`data`-key contract without double-nesting.
  return NextResponse.json({
    data: rows.map(shapeTenant),
    meta: { total, page, pageSize: paginated ? pageSize : total },
  });
}

// ─── POST /api/tenants ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  const body = await parseJson(req, createTenantSchema);
  if (!body.ok) return body.response;

  const input = body.data;
  const passwordHash = await bcrypt.hash(input.administrator.password, 10);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const tenant = await createTenantRecord(tx, input);
      await createTenantAdmin(tx, tenant.id, input, passwordHash);
      await writeAuditLog(
        {
          entityType: "Tenant",
          entityId: tenant.id,
          action: "CREATE",
          performedBy: guard.userId,
          changes: { tenantCode: tenant.tenantCode, cooperativeName: tenant.cooperativeName },
        },
        tx,
      );
      return findTenantByIdOrThrow(tenant.id, tx);
    });

    return NextResponse.json({ data: shapeTenant(created) }, { status: 201 });
  } catch (err) {
    const conflict = handlePrismaKnownError(err, TENANT_CREATE_CONFLICT_FIELDS);
    if (conflict) return conflict;
    throw err;
  }
}

// ─── helpers (POST) ───────────────────────────────────────────────────────────

function createTenantRecord(tx: Prisma.TransactionClient, input: CreateTenantInput) {
  return tx.tenant.create({
    data: {
      tenantCode: input.tenantCode,
      cooperativeName: input.cooperativeName,
      cooperativeAddress: input.cooperativeAddress,
    },
  });
}

function createTenantAdmin(
  tx: Prisma.TransactionClient,
  tenantId: string,
  input: CreateTenantInput,
  passwordHash: string,
) {
  return tx.user.create({
    data: {
      username: input.administrator.username,
      email: input.administrator.email,
      firstName: input.administrator.firstName,
      lastName: input.administrator.lastName,
      mobileNumber: input.administrator.mobileNumber || null,
      passwordHash,
      role: "TENANT_ADMIN",
      tenantId,
    },
  });
}
