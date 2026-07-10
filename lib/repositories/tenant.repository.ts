import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Canonical Prisma include for loading a Tenant with its first administrator.
 * Every list/detail read uses this shape so `shapeTenant` receives a stable payload.
 */
export const TENANT_INCLUDE_WITH_ADMIN = {
  administrators: { take: 1, orderBy: { createdAt: "asc" } },
} as const satisfies Prisma.TenantInclude;

export type TenantWithAdmin = Prisma.TenantGetPayload<{
  include: typeof TENANT_INCLUDE_WITH_ADMIN;
}>;

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

// ─── Loaders ──────────────────────────────────────────────────────────────────

/** Load an active (not soft-deleted) tenant by id, with its first administrator. */
export async function findActiveTenantById(
  id: string,
  client: PrismaClientLike = prisma,
): Promise<TenantWithAdmin | null> {
  return client.tenant.findFirst({
    where: { id, deletedAt: null },
    include: TENANT_INCLUDE_WITH_ADMIN,
  });
}

/** Reload a tenant by id after a mutation. Throws if not found. */
export async function findTenantByIdOrThrow(
  id: string,
  client: PrismaClientLike = prisma,
): Promise<TenantWithAdmin> {
  return client.tenant.findUniqueOrThrow({
    where: { id },
    include: TENANT_INCLUDE_WITH_ADMIN,
  });
}

// ─── Search / list ────────────────────────────────────────────────────────────

/** Columns on Tenant that the search query `q` should match against. */
const TENANT_TEXT_SEARCH_FIELDS = [
  "tenantCode",
  "cooperativeName",
  "cooperativeAddress",
] as const;

/** Columns on the administrator User that the search query `q` should match against. */
const ADMIN_TEXT_SEARCH_FIELDS = [
  "email",
  "firstName",
  "lastName",
  "username",
] as const;

/**
 * Build the Prisma `where` clause for the tenant list endpoint. Always
 * excludes soft-deleted rows. Applies status + free-text search when set.
 */
export function buildTenantListWhere(params: {
  q?: string;
  status?: "ACTIVE" | "INACTIVE";
}): Prisma.TenantWhereInput {
  const where: Prisma.TenantWhereInput = { deletedAt: null };
  if (params.status) where.status = params.status;

  if (params.q) {
    const q = params.q;
    where.OR = [
      ...TENANT_TEXT_SEARCH_FIELDS.map((field) => ({ [field]: { contains: q } })),
      {
        administrators: {
          some: {
            OR: ADMIN_TEXT_SEARCH_FIELDS.map((field) => ({ [field]: { contains: q } })),
          },
        },
      },
    ];
  }

  return where;
}

// ─── Conflict field maps (for `handlePrismaKnownError`) ───────────────────────

/** Prisma unique-column → user-facing field mapping for `POST /api/tenants`. */
export const TENANT_CREATE_CONFLICT_FIELDS = {
  tenantCode: { field: "tenantCode", message: "Tenant code already exists" },
  username: { field: "administrator.username", message: "Username already exists" },
  email: { field: "administrator.email", message: "Email already exists" },
} satisfies Record<string, { field: string; message: string }>;

/** Prisma unique-column → user-facing field mapping for `PUT /api/tenants/[id]`. */
export const TENANT_UPDATE_CONFLICT_FIELDS = {
  email: { field: "administrator.email", message: "Email already exists" },
} satisfies Record<string, { field: string; message: string }>;
