# NextCoop — System Admin Portal

Sprint scaffold for the NextCoop System Administrator portal per PBIs 24475, 24726, 24727, 24728, 24729.

## Stack

- Next.js 16 (App Router, Server Components) + TypeScript + Tailwind v4
- Prisma 6 + SQLite (`prisma/dev.db`)
- Auth.js v5 (Credentials, JWT session)
- shadcn/ui + TanStack Table (manual/controlled mode)
- Zod for validation, Zustand for sidebar UI state only

## Architecture rules

- **Server Components and Server Actions call the internal REST API** (`/api/tenants/...`) via `lib/api-client.ts` — they do **not** touch Prisma directly. Prisma is only imported inside API route handlers, `auth.config`, and the seed script (PBI 24729 AC-API-*).
- Every mutation is validated with Zod at the route-handler trust boundary; Server Actions also pre-validate for immediate UI feedback.
- URL `searchParams` drive filtering/sorting/pagination. TanStack Table is in `manual*` mode and only pushes URL updates — it does not own data or fetch.
- Middleware protects `(admin)/*` routes; API route handlers additionally re-check `role === "SYSTEM_ADMIN"`.

## Delete semantics (see §4 of the prompt)

`DELETE /api/tenants/[id]` performs a **soft delete**: it sets `status = INACTIVE` and stamps `deletedAt`, preserves dependent `User` rows, and writes an `AuditLog` `DELETE` entry. Soft-deleted tenants are excluded from listing and lookup endpoints.

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
prisma/                    schema, migrations, seed
stores/                    ui-store (sidebar collapse only)
```

## Branch convention

`feature/{PBI-ID}-short-desc` off `main`. Land PBI 24729 first (or stub) since 24726/24727/24728 depend on the API.

## Explicitly deferred

Per-tenant DBs, control-DB split, SSO/MFA, tenant admin portal, and automated tests are out of scope for this sprint.
