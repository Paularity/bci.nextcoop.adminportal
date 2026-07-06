import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
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
  const role = (session.user as { role?: string }).role;
  if (role !== "SYSTEM_ADMIN") return { error: fail(403, "Forbidden") } as const;
  const uid = (session.user as { id?: string }).id ?? "";
  return { session, userId: uid } as const;
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

export function stripPasswordHash<T extends { passwordHash?: string } | null | undefined>(u: T): T {
  if (!u) return u;
  const { passwordHash: _ph, ...rest } = u as { passwordHash?: string } & Record<string, unknown>;
  void _ph;
  return rest as unknown as T;
}

export function shapeTenant(tenant: {
  administrators: Array<Record<string, unknown> & { passwordHash?: string }>;
} & Record<string, unknown>) {
  const { administrators, ...rest } = tenant;
  return {
    ...rest,
    administrator: administrators[0] ? stripPasswordHash(administrators[0]) : null,
  };
}
