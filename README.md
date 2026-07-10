# NextCoop — System Admin Portal

Sprint scaffold for the NextCoop System Administrator portal per PBIs 24475, 24726, 24727, 24728, 24729.

> **Onboarding as a developer?** Read the docs in this order:
> 1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — layers, boundaries, invariants
> 2. [`docs/SERVER_SIDE.md`](./docs/SERVER_SIDE.md) — writing route handlers, schemas, audit logging
> 3. [`docs/CLIENT_SIDE.md`](./docs/CLIENT_SIDE.md) — pages, forms, filters, toasts, skeletons
>
> **Delivering this sprint step-by-step?** See [`docs/DELIVERY_GUIDE.md`](./docs/DELIVERY_GUIDE.md) — reproducing this project from an empty folder, partitioned per PBI (24475 · 24726 · 24727 · 24728 · 24729).

## Stack

- Next.js 16 (App Router, Server Components) + TypeScript + Tailwind v4 (utility only)
- Prisma 6 + SQLite (`prisma/dev.db`)
- Auth.js v5 (Credentials, JWT session)
- **Kendo React v15** (`@progress/kendo-react-*`) with the **NextCoop Blackfort theme** (`app/nextcoop-theme.css` — a compiled Kendo Theme Material v14 build with the Blackfort brand tokens). No shadcn.
- `shared/ui/*` package (mirrored from the reference `BCI.Accounting.WebPortal` project): `AppGrid`, `PageBreadcrumb`, `PageCard`, `ConfirmDialog`, `AppToast` + `toast.store`
- Zustand for client-only UI state (sidebar collapse, dashboard widgets, toast queue)
- Zod for validation (schemas in `lib/schemas/`, shared between actions and route handlers)

## Architecture rules

- **Server Components and Server Actions call the internal REST API** (`/api/tenants/...`) via `lib/api-client.ts` — they do **not** touch Prisma directly. Prisma is only imported inside API route handlers, `auth.config`, and the seed script (PBI 24729 AC-API-*).
- Every mutation is validated with Zod at the route-handler trust boundary; Server Actions also pre-validate for immediate UI feedback.
- URL `searchParams` drive server fetches for detail pages and dashboard aggregates. The tenants list Grid handles filter/sort/pagination in the browser (Kendo Grid + `@progress/kendo-data-query`'s `filterBy`) — one paginated fetch loads the working set, then the client owns the interaction.
- Middleware protects `(admin)/*` routes; API route handlers additionally re-check `role === "SYSTEM_ADMIN"`.

## API response conventions

- Single-resource endpoints return `{ data: <resource> }` (AC-API-08). Errors return `{ error: { message, fields? } }` with the correct status code.
- **List endpoints** return `{ data: <items[]>, meta: { total, page, pageSize } }`. Consumers use `apiFetchList<T, M>` from `lib/api-client.ts`; single-resource consumers use `apiFetch<T>`.
- Every state-changing route handler wraps its mutation **and** its `writeAuditLog` call inside the same `prisma.$transaction` — audit atomicity is a hard invariant.
- Unique-constraint races are handled: route handlers catch `Prisma.PrismaClientKnownRequestError` with `code === "P2002"` via `handlePrismaKnownError` and translate to `409` with field-level messages.

## Delete semantics (see §4 of the prompt)

`DELETE /api/tenants/[id]` performs a **soft delete**:
- `status` set to `INACTIVE`
- `deletedAt` stamped with current timestamp
- `tenantCode` renamed to `<original>__deleted-<timestamp>` — this frees the original code so a new tenant can reuse it without hitting the `@unique` constraint. The original code is preserved in the `AuditLog.changes.originalTenantCode` field.
- Dependent `User` rows and audit trail are preserved
- Soft-deleted tenants are excluded from list/detail endpoints via `deletedAt: null` in every `where`

Activate/deactivate are **idempotent** — activating an already-active tenant returns the current state with no audit-log noise, same for deactivate.

## Getting started

```bash
npm install
npx prisma migrate dev --name init   # already applied — skip if migration exists
npm run db:seed
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

### Seeded credentials

- System Admin — `sysadmin` / `Admin123!`
- Tenant Admins (for reference; portal not built this sprint) — `maria.santos`, `jose.reyes`, `ana.lim`, all with password `Tenant123!`

## Env vars

See `.env`:

- `DATABASE_URL` — SQLite file
- `AUTH_SECRET` — Auth.js signing secret (change in prod)
- `NEXTAUTH_URL` — session/callback URL
- `INTERNAL_API_BASE_URL` — base URL used by server-side fetch to reach the internal API

## Layout

```
app/
  (auth)/login/            PBI 24475
  (admin)/tenants/         PBI 24726 (dashboard), 24727 (new), 24728 ([id] view/edit/activate/deactivate/delete)
  api/tenants/             PBI 24729 (REST)
  api/auth/[...nextauth]/  Auth.js handler
actions/                   Server Actions — thin HTTP wrappers over /api
lib/                       db, api-client, audit, schemas, auth config
shared/ui/                 vendored UI kit — grid/AppGrid, page/PageBreadcrumb + PageCard,
                           dialog/ConfirmDialog, toast/AppToast + toast.store
prisma/                    schema, migrations, seed
stores/                    zustand stores — sidebar-store, dashboard-ui-store
```

## Branch convention

`feature/{PBI-ID}-short-desc` off `main`. Land PBI 24729 first (or stub) since 24726/24727/24728 depend on the API.

## Conscious deviations from the setup doc

Three UX changes were made after user review that intentionally diverge from the original prompt. They are noted here so a future reviewer doesn't file them as regressions:

- **UI kit swap.** The prompt named shadcn/ui + TanStack Table. Both were removed. Replaced by **Kendo React** components + a small vendored `shared/ui/*` kit copied from the reference `BCI.Accounting.WebPortal` (`AppGrid`, `PageBreadcrumb`, `PageCard`, `ConfirmDialog`, `AppToast`). The theme is `app/nextcoop-theme.css` — a compiled Kendo Theme Material v14 build with the Blackfort brand tokens.
- **Filter + list flow.** Tenants list uses a Kendo `Grid` (via `AppGrid`) with client-side filter/sort/pagination. The Server Component fetches a working set once via `apiFetchList`; the Grid owns the rest. The prompt described URL-driven filtering. URL semantics are still preserved for detail routes.
- **Confirmations.** Activate / Deactivate / Delete use Kendo `Dialog` (`shared/ui/dialog/confirm-dialog.tsx`) opened from client components inside a `useTransition`, calling the same Server Actions. The prompt (§5) specified separate confirm routes with no client modal. The `/tenants/[id]/activate|deactivate|delete` route files still exist and now `redirect` to the details page with `?confirm=...` so deep links continue to work.

## Trade-offs (do not "optimize" away)

`apiFetch` / `apiFetchList` in `lib/api-client.ts` do a real HTTP round trip from every SSR page back into the same process's route handlers. This is a **deliberate** requirement from PBI 24729 / AC-API-*: Server Components must consume the internal API, not import Prisma directly. Both helpers include `import "server-only"` so accidentally pulling them into a Client Component fails at build.

## Explicitly deferred

Per-tenant DBs, control-DB split, SSO/MFA, tenant admin portal, and automated tests are out of scope for this sprint.
