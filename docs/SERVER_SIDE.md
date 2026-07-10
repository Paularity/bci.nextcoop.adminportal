# Server-side integration guide

Read [ARCHITECTURE.md](./ARCHITECTURE.md) first. This guide is a step-by-step reference for **adding or changing anything on the API side**: route handlers, schemas, Prisma models, audit logging, error mapping.

---

## The mental model

A route handler is a 5-step pipeline. Always in this order:

```
[guard] → [validate] → [transaction (mutate + audit)] → [shape] → [respond]
```

If your handler is skipping a step, it's almost certainly a bug. Below is what each step looks like in real code.

---

## The canonical handler skeleton

```ts
// app/api/things/route.ts
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createThingSchema } from "@/lib/schemas/thing.schema";
import {
  fail,
  handlePrismaKnownError,
  ok,
  parseJson,
  requireSystemAdmin,
} from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  // 1. GUARD — always first
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;

  // 2. VALIDATE — Zod at the trust boundary
  const parsed = await parseJson(req, createThingSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  // 3. TRANSACTION — mutate and audit atomically
  try {
    const created = await prisma.$transaction(async (tx) => {
      const thing = await tx.thing.create({ data: { ...input } });
      await writeAuditLog(
        {
          entityType: "Thing",
          entityId: thing.id,
          action: "CREATE",
          performedBy: guard.userId,
          changes: { name: thing.name },
        },
        tx, // ← must pass the tx client
      );
      return thing;
    });

    // 4. SHAPE (strip secrets, project only what the client needs)
    // 5. RESPOND
    return ok(created, 201);
  } catch (err) {
    const conflict = handlePrismaKnownError(err, {
      name: { field: "name", message: "Name already exists" },
    });
    if (conflict) return conflict;
    throw err;
  }
}
```

Read `app/api/tenants/route.ts` for a fully-featured example (transaction, admin sub-record, P2002 mapping, shape helper).

---

## Step-by-step: adding a new resource

Suppose you're adding a `Product` resource.

### 1. Model it in Prisma

Edit `prisma/schema.prisma`:

```prisma
model Product {
  id        String   @id @default(cuid())
  sku       String   @unique
  name      String
  status    ProductStatus @default(ACTIVE)
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([deletedAt])
  @@index([status])
}
```

**Every resource that supports soft delete gets a `deletedAt DateTime?` field and a `@@index([deletedAt])`.** Every read query filters on `deletedAt: null`.

Run:
```bash
npx prisma migrate dev --name add_product
```

### 2. Write the Zod schema

Create `lib/schemas/product.schema.ts`:

```ts
import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().trim().min(2).regex(/^[A-Z0-9-]+$/),
  name: z.string().trim().min(2),
}).strict();
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const listProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["sku", "name", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

**Rules:**
- Object schemas are `.strict()`. Unknown fields → 400.
- Every field has a human message; that message ends up in the toast.
- Query schemas use `z.coerce.number()` — searchParams are strings on the wire.

### 3. Write the route handler

Create `app/api/products/route.ts` and `app/api/products/[productId]/route.ts`. Use the tenant handlers as the template:

- `GET /api/products` → filtered list, returns `{ data: [...], meta: {...} }` via `NextResponse.json`. Not `ok(...)` because list metadata needs to sit as a sibling of `data`.
- `POST /api/products` → transaction + audit + P2002 catch.
- `GET /api/products/[id]` → include `deletedAt: null` in the `where`. `ok(shapeProduct(...))`.
- `PUT /api/products/[id]` → transaction + audit + P2002 catch.
- `DELETE /api/products/[id]` → soft delete: set `deletedAt`, mark `INACTIVE`, and rename the unique field (`sku` here) to `<orig>__deleted-<ts>` inside the transaction.

If you have activate/deactivate semantics, add `[id]/activate/route.ts` and `[id]/deactivate/route.ts` and make them **idempotent** (short-circuit when target state matches, skip the audit write).

### 4. Type the response shape

For a single-resource DTO, follow the pattern in `lib/api-helpers.ts`:

```ts
type ProductPayload = Prisma.ProductGetPayload<Record<string, never>>;
export type ProductDto = Omit<ProductPayload, "sensitiveField">;

export function shapeProduct(p: ProductPayload): ProductDto {
  const { sensitiveField: _ignored, ...rest } = p;
  void _ignored;
  return rest;
}
```

If the resource has related entities you always include (like `Tenant.administrators`), use `Prisma.ProductGetPayload<{ include: { ... } }>` and shape accordingly.

---

## Response shape rules

Always exactly one of:

| Success | Failure |
| --- | --- |
| `ok(resource)` — 200 | `fail(400, "Validation failed", fields)` |
| `ok(resource, 201)` — Created | `fail(401, "Authentication required")` |
| `ok({ id, deleted: true })` — for deletes | `fail(403, "Forbidden")` |
| Manual `NextResponse.json({ data, meta })` — list | `fail(404, "Not found")` |
| | `fail(409, "Conflict", fields)` — via `handlePrismaKnownError` |

Never return raw Prisma errors, never leak stack traces, never omit `data`/`error` at the top level.

---

## Authorization

Every handler starts with:

```ts
const guard = await requireSystemAdmin();
if ("error" in guard) return guard.error;
// guard.session is the full session, guard.userId is session.user.id
```

If a future role (`TENANT_ADMIN`, etc.) needs its own scope, add a sibling helper (`requireTenantAdmin`, `requireAuthenticated`) in `lib/api-helpers.ts`. Do not check `role` ad-hoc inline in a handler.

---

## Audit logging rules

1. Every state-changing endpoint (POST / PUT / DELETE / activate / deactivate / anything else) writes an audit row.
2. The audit row is written **inside the same `prisma.$transaction`** as the mutation. Pass the `tx` client as the second argument to `writeAuditLog`:

    ```ts
    await prisma.$transaction(async (tx) => {
      await tx.thing.update({ ... });
      await writeAuditLog({ ... }, tx);
    });
    ```

3. The `changes` field should record enough context to understand *what* changed. For updates, capture `{ before, after }`. For creates, capture the identifying fields.
4. If you decide the action is a no-op (idempotent activate on an already-active tenant), **do not write an audit row**. It's noise.

---

## Prisma conflict handling

Do not pre-check unique constraints then insert — that's a race. Instead:

```ts
try {
  await prisma.$transaction(async (tx) => { ... });
} catch (err) {
  const conflict = handlePrismaKnownError(err, {
    // Prisma unique-constraint column → user-facing field + message
    sku: { field: "sku", message: "SKU already exists" },
    username: { field: "administrator.username", message: "Username already exists" },
  });
  if (conflict) return conflict;
  throw err;
}
```

`handlePrismaKnownError` inspects `err.meta.target` and translates a `P2002` into a 409. Anything else re-throws to Next.js's default 500 handler.

---

## Soft-delete pattern

Standard soft delete looks like:

```ts
export async function DELETE(_req, ctx) {
  const guard = await requireSystemAdmin();
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const existing = await prisma.thing.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail(404, "Not found");

  const freedKey = `${existing.uniqueKey}__deleted-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.thing.update({
      where: { id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
        uniqueKey: freedKey, // frees the original key for reuse
      },
    });
    await writeAuditLog(
      {
        entityType: "Thing",
        entityId: id,
        action: "DELETE",
        performedBy: guard.userId,
        changes: { softDelete: true, originalUniqueKey: existing.uniqueKey, freedUniqueKey: freedKey },
      },
      tx,
    );
  });

  return ok({ id, deleted: true });
}
```

And every read query includes `deletedAt: null`:

```ts
prisma.thing.findFirst({ where: { id, deletedAt: null } });
prisma.thing.findMany({ where: { deletedAt: null, ...otherFilters } });
```

---

## Idempotent state transitions

Activate/deactivate handlers:

```ts
if (existing.status === "ACTIVE") return ok(shapeThing(existing)); // no-op
```

Skip audit noise on no-ops. Return 200 with the current shape, not 409 — clients don't need to care that they clicked twice.

---

## Where to put helpers

| Need | Home |
| --- | --- |
| `ok`, `fail`, `parseJson`, `requireSystemAdmin`, `handlePrismaKnownError`, `shapeX` | `lib/api-helpers.ts` |
| A Zod schema | `lib/schemas/<resource>.schema.ts` |
| A cross-resource Prisma helper | Not yet — add to `lib/api-helpers.ts` or a new `lib/repositories/` folder if it grows past two files. Do not make one-off `lib/queries.ts` files. |

---

## Testing an endpoint (until Vitest lands)

Manually with the real dev DB:

```bash
# Log in via the browser to get a session cookie, then:
curl -X POST http://localhost:3000/api/tenants \
  -H "content-type: application/json" \
  -H "cookie: authjs.session-token=…" \
  -d '{"tenantCode":"COOP-999","cooperativeName":"Test","cooperativeAddress":"…","administrator":{...}}'
```

Prisma Studio (`npx prisma studio`) is the fastest way to inspect the DB while you iterate.

---

## Common mistakes to avoid

- ❌ Importing `prisma` from a page or Server Action.
- ❌ Calling `writeAuditLog` outside the transaction.
- ❌ Pre-checking a unique constraint instead of catching `P2002`.
- ❌ Returning raw Prisma objects that still contain `passwordHash`.
- ❌ Forgetting `deletedAt: null` on a read query.
- ❌ Adding a resource without a Zod schema.
- ❌ Redefining validation rules in the Server Action instead of importing the same schema.
- ❌ Returning `{ data: { data: [...], total: ... } }` — double-nesting. Lists use `{ data: [...], meta: {...} }`.

If your PR does any of the above, expect review pushback.
