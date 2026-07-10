# Delivery guide — NextCoop System Admin Portal

A step-by-step reproduction guide for building this project from an empty folder up to the current state, partitioned by PBI.

> **Read first.**
> - [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the invariants you must not break.
> - [`SERVER_SIDE.md`](./SERVER_SIDE.md) — the 5-step handler pipeline.
> - [`CLIENT_SIDE.md`](./CLIENT_SIDE.md) — the UI kit + form + list patterns.
>
> This file is for **delivery**: what to build, in what order, on what branch, and what "done" means for each PBI.

---

## Roadmap at a glance

| Phase | What you build | Branch |
| --- | --- | --- |
| 0 | Environment & repo | — |
| 1 | Foundations: scaffold, Prisma, Auth.js, Zod, shared/ui kit, Kendo React + theme | `chore/scaffold` |
| 2 | **PBI 24729** — Tenants REST API | `feature/24729-tenants-api` |
| 3 | **PBI 24475** — Login | `feature/24475-login` |
| 4 | **PBI 24726** — Tenants dashboard | `feature/24726-tenant-dashboard` |
| 5 | **PBI 24727** — Create tenant | `feature/24727-create-tenant` |
| 6 | **PBI 24728** — Tenant details / edit / activate / deactivate / delete | `feature/24728-tenant-details` |
| 7 | Docs, polish, deferred cleanup | `chore/docs` |

**Merge order matters.** Do 24729 first — 24726/24727/24728 all consume its endpoints. Do 24475 before you can log in and exercise the admin routes end-to-end.

---

## Phase 0 — Environment

**Prerequisites**

- Node.js 20.18+ (Prisma 6 requires this)
- npm 9+
- Git
- SQLite is bundled — no separate install

**Steps**

```bash
git init nextcoop.adminportal
cd nextcoop.adminportal
git checkout -b main
# ...create empty repo on the remote and push main
```

Set up `.gitignore` (Next.js default is fine; add `prisma/dev.db`, `prisma/dev.db-journal`, `.env`).

---

## Phase 1 — Foundations (branch: `chore/scaffold`)

Everything in this phase is shared plumbing. No PBI-visible surface yet.

### 1.1 Scaffold Next.js + Tailwind

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint --import-alias "@/*" --use-npm --yes
```

### 1.2 Install core dependencies

```bash
# Persistence + auth + validation
npm install prisma@^6 @prisma/client@^6
npx prisma init --datasource-provider sqlite
npm install zod next-auth@beta bcryptjs
npm install -D @types/bcryptjs tsx

# Server-only guard
npm install server-only

# UI kit — Kendo React (latest v15 line)
npm install \
  @progress/kendo-react-animation @progress/kendo-react-buttons \
  @progress/kendo-react-common @progress/kendo-react-dateinputs \
  @progress/kendo-react-dialogs @progress/kendo-react-dropdowns \
  @progress/kendo-react-form @progress/kendo-react-grid \
  @progress/kendo-react-indicators @progress/kendo-react-inputs \
  @progress/kendo-react-intl @progress/kendo-react-labels \
  @progress/kendo-react-layout @progress/kendo-react-notification \
  @progress/kendo-react-popup @progress/kendo-react-progressbars \
  @progress/kendo-react-ripple @progress/kendo-react-tooltip \
  @progress/kendo-react-data-tools \
  @progress/kendo-data-query @progress/kendo-svg-icons \
  @progress/kendo-theme-default @progress/kendo-licensing

# Icons + fetch client + zustand state
npm install lucide-react zustand date-fns
```

### 1.3 Prisma schema + seed

- `prisma/schema.prisma` — see the current file for the exact shape. Key models: `User`, `Tenant` (with `deletedAt: DateTime?` and `@@index([deletedAt])`, `@@index([status])`), `AuditLog`. Enums: `UserRole` (`SYSTEM_ADMIN | TENANT_ADMIN`), `TenantStatus` (`ACTIVE | INACTIVE`).
- `prisma/seed.ts` — creates one `sysadmin/Admin123!` System Admin plus 3 sample tenants with tenant admins.

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

Add `db:seed`, `db:migrate`, `db:reset` npm scripts to `package.json`.

### 1.4 `.env`

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-me-in-prod-please-32chars-min"
NEXTAUTH_URL="http://localhost:3000"
INTERNAL_API_BASE_URL="http://localhost:3000"
```

### 1.5 Auth.js base config

Create these files (see the current implementation for exact content):
- `types/next-auth.d.ts` — module augmentation adding `user.id` / `user.role`.
- `lib/auth/auth.config.ts` — Credentials provider, JWT session, callbacks.
- `auth.ts` — `NextAuth(authConfig)` singleton, exports `handlers`, `auth`, `signIn`, `signOut`.
- `proxy.ts` — Next 16 middleware that guards `(admin)/*`.
- `app/api/auth/[...nextauth]/route.ts` — mounts Auth.js.

### 1.6 Shared server helpers

- `lib/db.ts` — the one `PrismaClient` singleton.
- `lib/audit.ts` — `writeAuditLog(params, tx?)`; **always** callable from inside a transaction.
- `lib/api-helpers.ts` — `ok`, `fail`, `parseJson`, `requireSystemAdmin`, `handlePrismaKnownError`, `zodToFields`, `shapeTenant`, `stripPasswordHash`.
- `lib/api-client.ts` — server-only `apiFetch<T>` + `apiFetchList<T, M>`, both routed through a private `fetchApi` helper.
- `lib/schemas/tenant.schema.ts` — Zod: `createTenantSchema` (`.strict()`), `updateTenantSchema`, `listTenantsQuerySchema`.
- `lib/schemas/auth.schema.ts` — Zod: `loginSchema`.
- `lib/repositories/tenant.repository.ts` — `TENANT_INCLUDE_WITH_ADMIN` constant, `findActiveTenantById`, `findTenantByIdOrThrow`, `buildTenantListWhere`, `TENANT_CREATE_CONFLICT_FIELDS`, `TENANT_UPDATE_CONFLICT_FIELDS`.

### 1.7 Kendo theme + shared UI kit

- `app/nextcoop-theme.css` — the compiled Blackfort theme file. Import in `app/globals.css` **after** Tailwind:
  ```css
  @import "tailwindcss";
  @import "./nextcoop-theme.css";
  ```
- `app/globals.css` — declare CSS custom properties (`--brand-primary`, `--sidebar-bg`, `--card-border`, `--page-bg`) and body typography.

Vendored `shared/ui/*` kit (mirrored from the reference `BCI.Accounting.WebPortal`):
- `shared/ui/grid/app-grid.tsx` — `AppGrid<TData>` around Kendo `Grid` + `filterBy`, with `columnMenu` support and a toolbar Add button.
- `shared/ui/page/page-breadcrumb.tsx` — orange home icon + item chain.
- `shared/ui/page/page-card.tsx` — plain white padded card.
- `shared/ui/page/section-card.tsx` — bordered card with an optional title strip.
- `shared/ui/dialog/confirm-dialog.tsx` — Kendo `Dialog` + `DialogActionsBar` with `title` / `message` / `confirmLabel` / `confirmTheme`.
- `shared/ui/toast/toast.store.ts` — zustand toast queue + `toast.{success,error,warning,info}` façade.
- `shared/ui/toast/app-toast.tsx` — Kendo `Slide` + `SvgIcon` renderer for the queue.

### 1.8 Client stores

- `stores/sidebar-store.ts` — persistent zustand `{ expanded, toggle, setExpanded }`.
- `stores/dashboard-ui-store.ts` — persistent zustand for compact mode + widget visibility (needed for the dashboard page in phase 4).

### 1.9 Root layout + admin shell

- `app/layout.tsx` — mount `<AppToast />`.
- `app/(admin)/layout.tsx` — session guard → `<AdminShell>` client component.
- `app/(admin)/_components/admin-shell.tsx` — dark sidebar + Kendo `AppBar` topbar + avatar `Popup` with Account / Sign out.
- `app/(admin)/_components/flash-toaster.tsx` — reads flash query params (`?created=1`, `?updated=1`, `?activated=1`, `?deactivated=1`, `?deleted=1`, `?error=…`) and calls `toast.*`.

**Verify**

```bash
npx tsc --noEmit   # passes
npm run dev        # localhost:3000 boots, redirects to /login
```

**Merge / tag**

Commit as `chore(scaffold): project foundations`. Push and merge `chore/scaffold` → `main` before starting PBIs.

---

## Phase 2 — PBI 24729 · Tenants REST API (branch: `feature/24729-tenants-api`)

Ship this **first**. All other PBIs consume it.

**Scope**
- `GET /api/tenants` — filtered, sorted, paginated list.
- `POST /api/tenants` — create tenant + admin in one transaction.
- `GET /api/tenants/[tenantId]` — single tenant + first admin.
- `PUT /api/tenants/[tenantId]` — update tenant + admin fields.
- `DELETE /api/tenants/[tenantId]` — soft delete + tenantCode rename.
- `POST /api/tenants/[tenantId]/activate` — idempotent state change.
- `POST /api/tenants/[tenantId]/deactivate` — idempotent state change.

**Files to create**
- `app/api/tenants/route.ts` — GET + POST.
- `app/api/tenants/[tenantId]/route.ts` — GET + PUT + DELETE.
- `app/api/tenants/_lib/status-toggle.ts` — `makeStatusTogglePOST({ target, audit })` factory.
- `app/api/tenants/[tenantId]/activate/route.ts` — one-liner: `export const POST = makeStatusTogglePOST({ target: "ACTIVE", audit: "ACTIVATE" });`.
- `app/api/tenants/[tenantId]/deactivate/route.ts` — one-liner: `export const POST = makeStatusTogglePOST({ target: "INACTIVE", audit: "DEACTIVATE" });`.

**Invariants to enforce (verify manually before opening the PR)**
1. Every handler starts with `requireSystemAdmin`. → **AC-API-07, AC-LGN-05**.
2. Every handler validates its body/query with the shared Zod schema. → **AC-API-06, AC-CRT-02**.
3. Every mutation runs inside `prisma.$transaction`; `writeAuditLog` is called *inside* the same transaction. → **AC-DTL-07**.
4. Uniqueness collisions come back as `P2002` → `handlePrismaKnownError` → `409` with field-level messages. → **AC-CRT-04, AC-CRT-05**.
5. `shapeTenant` never returns `passwordHash`.
6. Every read includes `deletedAt: null` (via `findActiveTenantById` / `buildTenantListWhere`).
7. Soft delete renames `tenantCode` to `<original>__deleted-<ts>` and preserves the original in `AuditLog.changes`.
8. Activate/deactivate short-circuit when target status matches current — no audit noise. → **AC-DTL-04, AC-DTL-05**.
9. List response is `{ data: [...], meta: { total, page, pageSize } }`. Single-resource is `{ data: {...} }`. → **AC-API-08**.

**Manual QA**

Use Prisma Studio or a REST client to hit each endpoint with the seeded `sysadmin` cookie:
- 401 without a session
- 403 with a `TENANT_ADMIN` session
- 400 with a malformed body / unknown field (schemas are `.strict()`)
- 200 / 201 happy paths
- 409 with a duplicate tenantCode or admin username/email
- 404 for unknown tenant id

**Commit checkpoints**
1. `feat(24729): scaffold repository, api-helpers, audit atomicity`
2. `feat(24729): GET + POST /api/tenants with transaction + P2002 handling`
3. `feat(24729): GET/PUT/DELETE /api/tenants/[id] with audit changes builder`
4. `feat(24729): idempotent activate/deactivate via makeStatusTogglePOST`

Open PR → review vs. the AC-API-* list → merge.

---

## Phase 3 — PBI 24475 · Login (branch: `feature/24475-login`)

**Scope**
- `(auth)/login/page.tsx` — centered card, brand mark, "Login" heading.
- `(auth)/login/login-form.tsx` — Kendo `Input` + `Checkbox` + `Button` inside `<form action={loginAction}>`.
- `(auth)/layout.tsx` — centered flex layout on `--page-bg`.
- `actions/auth.ts` — `loginAction` (calls `signIn("credentials")` inside `useActionState`), `logoutAction` (`signOut` + redirect).

**Files to create**
- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/login/login-form.tsx`
- `actions/auth.ts`
- Auth.js `authorize()` in `lib/auth/auth.config.ts` already scaffolded in phase 1 — verify it rejects `TENANT_ADMIN` whose tenant is soft-deleted or `INACTIVE`.

**Invariants**
- `signIn` returns generic "Invalid username or password" — never leak which field is wrong. → **AC-LGN-03**.
- Successful login redirects to `/dashboard`. → **AC-LGN-02**.
- Session uses JWT with `role` in the claim. Middleware (`proxy.ts`) redirects any non-`SYSTEM_ADMIN` on `(admin)/*` to `/login?error=forbidden`. → **AC-LGN-05, AC-LGN-06**.
- Toast on form error via `toast.error(state.error)` in a `useEffect`. Inline field errors under each input.

**Manual QA**
- Wrong password: form re-renders with the values, generic "Invalid username or password" toast, no leak.
- `TENANT_ADMIN` with an active tenant: also gets rejected (portal is SYSTEM_ADMIN only).
- After login: sidebar + topbar render; `?error=forbidden` triggers the error toast on the login screen.

**Commit checkpoints**
1. `feat(24475): auth config + login form + logout action`
2. `feat(24475): middleware guard for (admin)/* + session role in JWT`

---

## Phase 4 — PBI 24726 · Tenants Dashboard (branch: `feature/24726-tenant-dashboard`)

**Scope**
- `/tenants` — Kendo `Grid` with sortable + column-menu filters (per the [Kendo filter-menu customization pattern](https://demos.telerik.com/kendo-ui/grid/filter-menu-customization)).

**Files to create**
- `app/(admin)/tenants/page.tsx` — Server Component: fetches via `apiFetchList`, renders `PageBreadcrumb` → `<h1>` → `SectionCard` with `TenantsGrid`.
- `app/(admin)/tenants/_components/types.ts` — `TenantRow`, `TenantListMeta`.
- `app/(admin)/tenants/_components/tenants-grid.tsx` — Client Component: derives `Row` from `TenantRow` with `administratorName`, `administratorEmail`, `createdAtDate: Date`. Column defs use `filter: "text" | "date"`, per-column `columnMenu`:
  - Text columns → `StandardColumnMenu = (props) => <GridColumnMenuFilter {...props} expanded />`
  - Status column → `StatusColumnMenu = makeCheckboxColumnMenu(rows)` returning `<GridColumnMenuCheckboxFilter data={rows} expanded />`
  - Actions column → `columnMenu: undefined`
  - Grid-level `columnMenu={StandardColumnMenu}` in `AppGrid` (auto-hides the inline filter row).
- `app/(admin)/tenants/loading.tsx` — Kendo `Skeleton` matching the layout.
- `app/(admin)/_components/flash-toaster.tsx` — reuse from phase 1.

**Invariants**
- Grid header shows every filterable column with a menu icon.
- Status column filters via a **checkbox list** (Active / Inactive).
- Created column filters via a **date picker**.
- Delete cell action opens `ConfirmDialog` (title, message, confirm label with `pending` state) and calls `deleteTenantAction` inside `useTransition`. `NEXT_REDIRECT` is filtered out of the toast path.
- Empty state renders the `EmptyState` component when the API returns zero rows. → **AC-DSH-08**.
- Row columns: Tenant Code, Cooperative Name, Tenant Admin, Email, Status (via `StatusCell` pill), Created (formatted via column `format`). → **AC-DSH-02**.
- Toolbar `+ Create Tenant` button routes to `/tenants/new`. → **AC-DSH-04**.

**Manual QA**
- Filter by Status (checkbox), by Cooperative Name (`contains`), by Created (`is after` / `between`).
- Sort by any column via header click.
- Paginate at `pageSize=10`.
- Row action View → `/tenants/[id]`, Edit → `/tenants/[id]/edit`, Delete → dialog.
- Empty state: delete all rows via API; the page shows "No tenants yet" with a create button.

**Commit checkpoints**
1. `feat(24726): tenants list page + AppGrid column-menu filtering`
2. `feat(24726): delete confirmation via ConfirmDialog + useTransition`
3. `feat(24726): loading skeleton`

---

## Phase 5 — PBI 24727 · Create Tenant (branch: `feature/24727-create-tenant`)

**Scope**
- `/tenants/new` — one form, three sections: Cooperative, Administrator, Account.
- Submits to `POST /api/tenants` via `createTenantAction` (Server Action).

**Files to create**
- `app/(admin)/tenants/new/page.tsx` — Server Component. `PageBreadcrumb` → `<h1>` → centered `SectionCard` with `CreateTenantForm`.
- `app/(admin)/tenants/new/create-form.tsx` — Client Component: three `<section>` groups of Kendo `Input` + `Label`, footer with Cancel + Save.
- `app/(admin)/tenants/new/loading.tsx` — Kendo `Skeleton`.
- `actions/tenants.ts` — `createTenantAction` via the shared `submitTenantForm` helper.

**Invariants**
- Server Action pre-validates with the same `createTenantSchema` (already declared in phase 1). Field-level errors go back into `state.fields`; the toast fires from a `useEffect` on `state.error`.
- Values echoed back on error so the form doesn't lose input.
- Success redirects to `/tenants?created=1` — the `FlashToaster` picks it up and shows "Tenant created successfully."
- The API-level `POST /api/tenants` (already shipped in phase 2) wraps tenant + admin creation in a single `prisma.$transaction` with audit-in-tx. Conflicts return field-mapped 409 messages that the form renders inline. → **AC-CRT-03, AC-CRT-04, AC-CRT-05, AC-CRT-06**.
- Cancel is a plain `<Link href="/tenants">` — no form submission. → **AC-CRT-07**.

**Manual QA**
- Submit empty → inline errors from Zod on every required field.
- Submit with a duplicate `tenantCode` → 409 → inline error under Tenant Code.
- Submit with a duplicate `username` → 409 → inline error under Username.
- Submit valid data → redirect to `/tenants` → success toast → new row appears in the Grid.

**Commit checkpoints**
1. `feat(24727): create tenant page + form`
2. `feat(24727): server action + flash toast on success`

---

## Phase 6 — PBI 24728 · Tenant Details (branch: `feature/24728-tenant-details`)

**Scope**
- `/tenants/[tenantId]` — read-only view.
- `/tenants/[tenantId]/edit` — edit form.
- `/tenants/[tenantId]/activate|deactivate|delete` — legacy confirm routes that redirect to details with `?confirm=…`.
- Details page: Edit + Activate/Deactivate + Delete buttons wired to `ConfirmDialog` + `useTransition`.

**Files to create**
- `app/(admin)/tenants/[tenantId]/page.tsx` — Server Component with `PageBreadcrumb`, status badge, action buttons, `SectionCard` containing "Cooperative Information" and "Administrator" InfoRow lists.
- `app/(admin)/tenants/[tenantId]/loading.tsx` — Kendo `Skeleton`.
- `app/(admin)/tenants/_components/tenant-action-dialogs.tsx` — Client Component: `useState` for `target: "activate" | "deactivate" | "delete" | null`, `useTransition` for `pending`, `ConfirmDialog` with per-kind copy.
- `app/(admin)/tenants/[tenantId]/edit/page.tsx` — Server Component: fetches tenant, renders `SectionCard` with `EditTenantForm`.
- `app/(admin)/tenants/[tenantId]/edit/edit-form.tsx` — Client Component with pre-filled Kendo `Input`s.
- `app/(admin)/tenants/[tenantId]/edit/loading.tsx` — Kendo `Skeleton`.
- `app/(admin)/tenants/[tenantId]/{activate,deactivate,delete}/page.tsx` — three tiny redirect pages: `redirect(\`/tenants/${tenantId}?confirm=…\`)`.
- `actions/tenants.ts` — extend with `updateTenantAction`, `activateTenantAction`, `deactivateTenantAction`, `deleteTenantAction`; they use the shared `submitTenantForm` and `runTenantMutation` helpers.

**Invariants**
- Cards show status pill + admin info; admin name links via `<Link>` (mockup uses a blue underline). → **AC-DTL-01, AC-DTL-02**.
- Edit route pre-fills the form, submits via `updateTenantAction`, success redirects to `/tenants/[id]?updated=1`. → **AC-DTL-03**.
- Activate button opens `ConfirmDialog` → `activateTenantAction` → API `POST /activate` → redirect with `?activated=1`. Same for deactivate and delete. → **AC-DTL-04, AC-DTL-05, AC-DTL-06**.
- Every mutating API endpoint has already been shipped (phase 2) with audit-in-tx. → **AC-DTL-07**.

**Manual QA**
- Details page: labels/values render, status pill shows correctly for both Active/Inactive tenants.
- Edit: change name → save → return to details with success toast → data updated.
- Deactivate: dialog opens with warning message → confirm → returns with `?deactivated=1` toast → status pill flips.
- Activate: mirror of deactivate.
- Delete: dialog opens with soft-delete warning → confirm → redirect to `/tenants?deleted=1` → row no longer in the Grid; API level, the row is renamed and marked `deletedAt`.

**Commit checkpoints**
1. `feat(24728): tenant details + info cards + status pill`
2. `feat(24728): edit form + updateTenantAction`
3. `feat(24728): activate/deactivate/delete via ConfirmDialog`
4. `feat(24728): legacy confirm route redirects`

---

## Phase 7 — Docs, polish, deferred cleanup (branch: `chore/docs`)

- Update `README.md` — stack line, response conventions, delete semantics, conscious deviations.
- Fill `docs/ARCHITECTURE.md`, `docs/SERVER_SIDE.md`, `docs/CLIENT_SIDE.md` if you didn't already.
- Verify `docs/DELIVERY_GUIDE.md` (this file) reflects the final branch/PR names actually used.
- Delete any orphaned files or unused deps (`npm ls`).
- Run one last:
  ```bash
  npx tsc --noEmit
  npm run db:reset && npm run db:seed
  npm run dev
  ```
  And smoke-test the whole login → dashboard → create → edit → deactivate → delete loop.

**Explicitly deferred** — do NOT include in these PBIs:
- Per-tenant DBs, control-DB split, connection pooling — the multi-tenant-DB architecture from the base scoping doc.
- SSO / MFA / any auth beyond Credentials + JWT session.
- Tenant Administrator's own portal (24727 creates the account; it doesn't build the surface they'd log into).
- Automated tests (Vitest/Playwright) — add as a follow-up sprint.

---

## Verification checklist (before final delivery)

Run through this end-to-end with the seeded database:

**Auth (PBI 24475)**
- [ ] `/` redirects to `/dashboard` when logged in, to `/login` when not.
- [ ] Wrong password shows a generic error toast; form values are retained.
- [ ] `TENANT_ADMIN` accounts can't sign in.
- [ ] Sign out via sidebar footer icon works.
- [ ] Sign out via topbar avatar → Popup → Sign out works.

**API (PBI 24729)**
- [ ] `GET /api/tenants` returns `{ data, meta }` and respects `q`, `status`, `page`, `pageSize`, `sort`, `order`.
- [ ] `POST /api/tenants` creates tenant + admin atomically; audit row written inside the transaction; 409 on collisions.
- [ ] `GET /api/tenants/[id]` returns 404 for soft-deleted / unknown ids.
- [ ] `PUT /api/tenants/[id]` writes the audit diff (`before`/`after`) inside the transaction.
- [ ] `DELETE /api/tenants/[id]` renames `tenantCode` and stamps `deletedAt`; audit record includes `originalTenantCode` and `freedTenantCode`.
- [ ] Activate/deactivate are idempotent (no audit noise on repeat calls).

**Dashboard (PBI 24726)**
- [ ] Grid renders with column-menu filters on each filterable column.
- [ ] Status column filter shows a checkbox list.
- [ ] Created column filter shows a date picker.
- [ ] Sort, filter, and pagination all commit through the Grid.
- [ ] Empty state renders with a "Create the first one" CTA.

**Create (PBI 24727)**
- [ ] Form validation errors show inline under each field.
- [ ] Duplicate `tenantCode` / `username` / `email` render field-specific 409 errors.
- [ ] Success redirects and fires the flash toast.

**Details / Edit (PBI 24728)**
- [ ] Details page shows both info cards + status pill.
- [ ] Edit form is pre-filled and updates the record.
- [ ] Activate / Deactivate / Delete each open the confirmation dialog and toast on success.

**Documentation**
- [ ] `README.md` + `docs/*.md` describe the current stack (Kendo React, shared/ui, zustand, no shadcn).
- [ ] `docs/DELIVERY_GUIDE.md` (this file) matches the branches you actually shipped.

Once every box is ticked, the delivery is complete.

---

## Working with the team

**Branch discipline.** `feature/{PBI-ID}-short-desc` off `main`, PR into `main`, one PBI per PR. Squash-merge if the team prefers.

**Review focus.** For every PR, the reviewer should confirm:
1. All API mutations run through `prisma.$transaction` with `writeAuditLog` inside.
2. No `passwordHash` in any API response.
3. Zod schemas are `.strict()` and referenced by both the Server Action and the route handler.
4. UI components use `shared/ui/*` primitives + Kendo React — no shadcn, no plain `<button>`/`<input>` markup.
5. Toasts route through `@/shared/ui/toast/toast.store`; flash redirects use the `?created=1|updated=1|activated=1|deactivated=1|deleted=1|error=…` convention.
6. Loading skeletons mirror the real layout.
7. `npx tsc --noEmit` and `npm run dev` both clean before the PR opens.

**Onboarding a new dev to this project**: point them at [`ARCHITECTURE.md`](./ARCHITECTURE.md) → [`SERVER_SIDE.md`](./SERVER_SIDE.md) → [`CLIENT_SIDE.md`](./CLIENT_SIDE.md), in that order. Then this delivery guide for the "how to build the next feature" playbook.
