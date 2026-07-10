# Architecture

This document explains the shape of the codebase, the layers, the trust boundaries, and the invariants a change must not violate. If you are onboarding, read this **first**. Then pick either [Server-side integration](./SERVER_SIDE.md) or [Client-side integration](./CLIENT_SIDE.md) depending on where you're working.

---

## The one-diagram summary

```
 ┌──────────────────── Browser ────────────────────┐
 │ Server Component (page.tsx)                     │
 │   │                                             │
 │   │  await apiFetch("/api/tenants/…")           │
 │   ▼                                             │
 │ Server Action  ──── uses same schema ───┐       │
 │   │                                     │       │
 │   ▼                                     │       │
 │ apiFetch (server-only, HTTP)            │       │
 │   │                                     │       │
 └───┼─────────────────────────────────────┼───────┘
     │                                     │
     ▼                                     ▼
 ┌──────────────── /api/tenants/… ─────────────────┐
 │ 1. requireSystemAdmin()   (401 / 403)           │
 │ 2. parseJson(req, schema) (400)                 │
 │ 3. prisma.$transaction (mutate + writeAuditLog) │
 │ 4. shapeTenant(...) — strips passwordHash       │
 │ 5. ok(...) or fail(...)                         │
 └─────────────────────────────────────────────────┘
                        │
                        ▼
                    Prisma → SQLite
```

**Key rule**: pages and Server Actions **never import Prisma**. All data flow crosses the internal REST API layer (`/api/tenants/*`). This is enforced by `import "server-only"` on `lib/api-client.ts` and by convention on `lib/db.ts`.

---

## Layers and file map

| Layer | Path | Purpose |
| --- | --- | --- |
| Pages / Server Components | `app/(admin)/**/page.tsx` | Render + SSR fetch via `apiFetch` |
| Route Handlers (REST API) | `app/api/tenants/**/route.ts` | Guard → validate → Prisma → audit → respond |
| Server Actions | `actions/*.ts` | Thin HTTP wrappers over `/api`, called from `<form action>` |
| Client components | `app/(admin)/**/_components/*.tsx` (with `"use client"`) | Interactivity only — dialogs, filters, forms |
| Schemas | `lib/schemas/*.schema.ts` | Zod — **the single source of truth** for shape |
| Auth config | `lib/auth/auth.config.ts` + `auth.ts` | Credentials + JWT + role in session |
| API helpers | `lib/api-helpers.ts` | `ok`, `fail`, `requireSystemAdmin`, `parseJson`, `shapeTenant`, `handlePrismaKnownError` |
| API client | `lib/api-client.ts` | Server-only `apiFetch` / `apiFetchList` |
| Prisma singleton | `lib/db.ts` | The only `PrismaClient` instance |
| Audit | `lib/audit.ts` | `writeAuditLog(params, tx?)` — must be called inside the mutation's transaction |
| Middleware | `proxy.ts` | Next 16 middleware; session + role redirect for `(admin)/*` |
| Shared UI kit | `shared/ui/*` | Vendored building blocks — `AppGrid` (Kendo `Grid`), `PageBreadcrumb`, `PageCard`, `ConfirmDialog` (Kendo `Dialog`), `AppToast` + `toast.store`. Copy the pattern; do not fork the file. |
| Client stores | `stores/*.ts` | Zustand: `sidebar-store` (persistent expanded/collapsed), `dashboard-ui-store` (widget visibility, compact mode). Client-only UI ephemera — never domain data. |
| Kendo theme | `app/nextcoop-theme.css` | Compiled Kendo Theme Material v14 with the Blackfort brand tokens. Imported after Tailwind in `app/globals.css`. Do not edit — replace as a compiled artefact. |

`lib/db.ts` and `lib/audit.ts` may only be imported from `app/api/**`, `lib/auth/**`, `lib/api-helpers.ts`, or `prisma/seed.ts`. If you find yourself importing them elsewhere, you're bypassing the API layer.

---

## Trust boundaries

There are exactly two:

1. **HTTP → route handler** — every route handler starts with:
   ```ts
   const guard = await requireSystemAdmin();
   if ("error" in guard) return guard.error;
   ```
   Then either `parseJson(req, schema)` for mutations or `schema.safeParse(query)` for reads. Anything before those two lines is untrusted input.

2. **Route handler → database** — Prisma queries assume validated input. Uniqueness races are caught by `handlePrismaKnownError` on `P2002` — do not re-implement a pre-check + insert pattern; it races.

`proxy.ts` (middleware) is a **UX convenience**, not a security boundary. It redirects unauthenticated users on `(admin)/*` to `/login`. Do not rely on it to protect the API — every route handler must re-check its own session.

---

## Invariants (never break these)

1. **No Prisma outside the API layer.** Server Components and Server Actions call `apiFetch` / `apiFetchList`. Verified by `import "server-only"` on `lib/api-client.ts`.
2. **`writeAuditLog` must run inside the same `prisma.$transaction` as the mutation it audits.** If the write fails, the audit must fail with it. Pass `tx` as the second argument.
3. **`passwordHash` never leaves the server.** Always run user objects through `stripPasswordHash` / `shapeTenant` before returning.
4. **Zod schemas are single-source.** Both the Server Action and the route handler import the same schema from `lib/schemas/`. Never redefine field rules in two places. All object schemas use `.strict()` — unknown fields fail with `400`.
5. **API response shape:**
   - Success: `{ data: <resource> }` for single, `{ data: <items[]>, meta: {...} }` for lists.
   - Error: `{ error: { message: string, fields?: Record<string, string> } }` with the correct HTTP status.
6. **URL is the source of truth for list state.** Filters, sort, and page live in `searchParams`. Do not stuff them in React state that survives navigation — the URL is the reload contract.
7. **Soft delete is a rename + flag.** `DELETE /api/tenants/[id]` sets `status = INACTIVE`, stamps `deletedAt`, and renames `tenantCode` to `<original>__deleted-<ts>` so the code frees up. Every read query must include `deletedAt: null` in its `where`.

---

## Response shape at the wire

**Single resource:**
```json
{ "data": { "id": "clx...", "tenantCode": "COOP-001", ... } }
```

**List:**
```json
{
  "data": [ { "id": "clx...", ... }, ... ],
  "meta": { "total": 42, "page": 1, "pageSize": 10 }
}
```

**Error:**
```json
{
  "error": {
    "message": "Validation failed",
    "fields": { "administrator.email": "Email already exists" }
  }
}
```

Consumers use `apiFetch<T>` for single resources and `apiFetchList<T, M>` for paginated lists — see the client-side guide.

---

## Auth flow

1. User posts to `/login` → Server Action → `signIn("credentials", ...)` → `authorize()` in `lib/auth/auth.config.ts`.
2. `authorize()` looks up the user, `bcrypt.compare`s the password, and additionally rejects `TENANT_ADMIN` whose tenant is soft-deleted or inactive.
3. The `jwt` callback embeds `uid` and `role` in the JWT.
4. The `session` callback exposes them as `session.user.id` and `session.user.role`. Types are augmented in `types/next-auth.d.ts` so no casts are needed in consumers.
5. `proxy.ts` redirects unauthenticated users on `(admin)/*` to `/login`. It does not protect the API.
6. Route handlers call `requireSystemAdmin()` — this is the actual authorization gate.

---

## Frontend shell

- `app/layout.tsx` — mounts `TooltipProvider` and `Toaster` (top-right, rich colors, close button).
- `app/layout.tsx` — mounts the theme via `app/globals.css` (`@import "tailwindcss"` → `@import "./nextcoop-theme.css"`) and renders `<AppToast />` (Kendo `NotificationGroup` at top-right).
- `app/(admin)/layout.tsx` — session guard, then a client `<AdminShell>` that owns the sidebar + Kendo `AppBar` topbar + main content.
- `AdminShell` — custom flex sidebar (dark `#1e1e1e`, `240px` expanded / `72px` icon-only), driven by `stores/sidebar-store.ts` (zustand + `persist`). Brand tile + nav items + user tile with an always-visible `LogOut` icon button.
- Topbar — Kendo `AppBar` (white, sticky, `64px`), containing a `My Requests` Kendo `DropDownButton`, a notifications bell, a divider, and an avatar button that opens a Kendo `Popup` account menu (Account + Sign out).
- `FlashToaster` reads `?created=1`, `?updated=1`, `?activated=1`, `?deactivated=1`, `?deleted=1`, `?error=<msg>` from `searchParams`, calls `toast.success` / `toast.error` from `@/shared/ui/toast/toast.store`, then strips the params from the URL.

The `dark` class is scoped to the sidebar and topbar wrappers — the rest of the app stays light. No custom color tokens.

---

## Data model (Prisma)

```
User { id, username @unique, email @unique, passwordHash,
       firstName, lastName, mobileNumber?, role, tenantId?, tenant? }
Tenant { id, tenantCode @unique, cooperativeName, cooperativeAddress,
         status (ACTIVE | INACTIVE), deletedAt?, administrators: User[] }
AuditLog { id, entityType, entityId, action, performedBy, changes?, createdAt }
```

Indexes on `Tenant.deletedAt` and `Tenant.status` — the soft-delete filter is on every read path so it stays fast.

---

## What is *deliberately* not here

- **Client-side data fetching.** No `useEffect(fetch)`, no SWR, no React Query. Every fetch is SSR through `apiFetch`.
- **Direct Prisma imports from pages.** Enforced by `server-only` and code review — do not re-open this door for "just one" case.
- **Global client-side state for domain data.** Zustand was removed. Anything shared between components must round-trip through the URL or the API.
- **Tests.** Deferred this sprint. Add Vitest + Playwright when picked up.

---

## Where to go next

- Writing an API endpoint or resource model change → [SERVER_SIDE.md](./SERVER_SIDE.md)
- Writing a page, form, or filter → [CLIENT_SIDE.md](./CLIENT_SIDE.md)
