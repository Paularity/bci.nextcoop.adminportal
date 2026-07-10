import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ data }, typeof init === "number" ? { status: init } : init);
}

export function fail(
  status: number,
  message: string,
  fields?: Record<string, string>
) {
  return NextResponse.json({ error: { message, fields } }, { status });
}

export function zodToFields(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function requireSystemAdmin() {
  const session = await auth();
  if (!session?.user) return { error: fail(401, "Authentication required") } as const;
  if (session.user.role !== "SYSTEM_ADMIN") {
    return { error: fail(403, "Forbidden") } as const;
  }
  return { session, userId: session.user.id } as const;
}

export async function parseJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: fail(400, "Invalid JSON body") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: fail(400, "Validation failed", zodToFields(parsed.error)),
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Translate a Prisma unique-constraint violation (P2002) into a 409 response,
 * mapping each conflicting column into `fields` so the client can highlight it.
 */
export function handlePrismaKnownError(
  err: unknown,
  fieldLabelMap: Record<string, { field: string; message: string }> = {}
): NextResponse | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (err.code !== "P2002") return null;
  const targets = (err.meta as { target?: string[] | string } | undefined)?.target;
  const cols = Array.isArray(targets) ? targets : targets ? [targets] : [];
  const fields: Record<string, string> = {};
  for (const col of cols) {
    const mapped = fieldLabelMap[col];
    if (mapped) fields[mapped.field] = mapped.message;
    else fields[col] = `${col} already exists`;
  }
  return fail(409, "Conflict", fields);
}

// ---------- resource shape helpers ---------------------------------------

type AdminPayload = Prisma.UserGetPayload<Record<string, never>>;
type TenantWithAdmins = Prisma.TenantGetPayload<{
  include: { administrators: true };
}>;

type AdminDto = Omit<AdminPayload, "passwordHash">;
export type TenantDto = Omit<TenantWithAdmins, "administrators"> & {
  administrator: AdminDto | null;
};

function stripPasswordHash(user: AdminPayload): AdminDto {
  const { passwordHash: _ignored, ...rest } = user;
  void _ignored;
  return rest;
}

export function shapeTenant(tenant: TenantWithAdmins): TenantDto {
  const { administrators, ...rest } = tenant;
  return {
    ...rest,
    administrator: administrators[0] ? stripPasswordHash(administrators[0]) : null,
  };
}
