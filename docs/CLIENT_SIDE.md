# Client-side integration guide

Read [ARCHITECTURE.md](./ARCHITECTURE.md) first. This guide is a step-by-step reference for anything you render — pages, forms, filters, tables, dialogs, toasts, loading states.

If you touch data, also read [SERVER_SIDE.md](./SERVER_SIDE.md) so you know what the API contract you're consuming looks like.

---

## The mental model

You have three kinds of components. Know which one you're writing before you start.

| Kind                       | Marker                                      | Runs where                | Can call                                                | Cannot call                                 |
| -------------------------- | ------------------------------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Server Component (default) | none                                        | server                    | `apiFetch`, `apiFetchList`, other server components | `useState`, `useEffect`, event handlers |
| Server Action              | `"use server"` at top of file or function | server                    | `apiFetch`, `revalidatePath`, `redirect`          | React hooks                                 |
| Client Component           | `"use client"` at top of file             | browser (after hydration) | React hooks, event handlers,`router.push`             | Prisma,`headers()`, `apiFetch`          |

**Default to server components.** Only add `"use client"` when you need interactivity — hooks, event handlers, dialogs, live filters, Kendo components that use context (Grid, DropDownButton, Popup, Dialog).

---

## UI kit — what you have, where it lives

We use **Kendo React** (`@progress/kendo-react-*`) for interactive components + a small vendored `shared/ui/*` kit that wraps common page patterns. Do not install other component libraries; do not fork the Kendo primitives.

**Vendored building blocks under `shared/ui/`:**

| Path                                    | Purpose                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/grid/app-grid.tsx`         | `AppGrid<TData>` — wraps Kendo `Grid` with a column-def array, client-side filter (`filterBy` from `@progress/kendo-data-query`), optional toolbar with an add button. Use for every list.                                                                                         |
| `shared/ui/page/page-breadcrumb.tsx`  | `PageBreadcrumb` — orange home icon + slash-separated items. Every page starts with one.                                                                                                                                                                                                 |
| `shared/ui/page/page-card.tsx`        | `PageCard` — `rounded-xl bg-white p-6 shadow-sm`. Generic white card. For pages that need a bordered header strip inside the card, use a plain `<div className="overflow-hidden rounded-lg bg-white shadow-sm" style={{ border: "1px solid var(--card-border)" }}>…</div>` instead. |
| `shared/ui/dialog/confirm-dialog.tsx` | `ConfirmDialog` — Kendo `Dialog` + `DialogActionsBar` with `title` / `message` / `confirmLabel` / `confirmTheme` / `onConfirm` / `onCancel`. Use for every confirm-modal need.                                                                                           |
| `shared/ui/toast/toast.store.ts`      | `useToastStore` + `toast.{success,error,warning,info}(message)` — global toast queue backed by zustand. Import `toast` and call it from anywhere client-side.                                                                                                                        |
| `shared/ui/toast/app-toast.tsx`       | `<AppToast />` — mounted once in `app/layout.tsx`, renders every toast in the queue via Kendo `Slide` + `SvgIcon`. Do not mount twice.                                                                                                                                             |

**Kendo React modules we use:**

- `@progress/kendo-react-buttons` — `Button`, `DropDownButton`
- `@progress/kendo-react-inputs` — `Input`, `Checkbox`, `TextArea`
- `@progress/kendo-react-labels` — `Label`
- `@progress/kendo-react-dropdowns` — `DropDownList`, `ComboBox`
- `@progress/kendo-react-dialogs` — `Dialog`, `DialogActionsBar` (used via `ConfirmDialog`)
- `@progress/kendo-react-layout` — `AppBar`, `Avatar`, `Card` (and its subparts)
- `@progress/kendo-react-indicators` — `Badge`, `Loader`, `Skeleton`
- `@progress/kendo-react-notification` — `Notification`, `NotificationGroup` (used via `AppToast`)
- `@progress/kendo-react-popup` — `Popup` (used for the topbar avatar menu)
- `@progress/kendo-react-grid` — `Grid` (used via `AppGrid`)
- `@progress/kendo-svg-icons` — icons for Grid action cells and toast severity (`pencilIcon`, `trashIcon`, `eyeIcon`, `checkCircleIcon`, `xIcon`, …)

**Lucide** (`lucide-react`) is kept for non-Kendo icons — sidebar nav, breadcrumbs, quick-action buttons.

---

## Fetching data on a page (Server Component)

Server Components call the internal REST API via `apiFetch` / `apiFetchList` from `lib/api-client.ts`. These helpers are `import "server-only"` — trying to use them from a client component fails at build.

**Single resource:**

```tsx
// app/(admin)/tenants/[tenantId]/page.tsx
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { TenantRow } from "../_components/types";

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const res = await apiFetch<TenantRow>(`/api/tenants/${tenantId}`);

  if (!res.ok) {
    if (res.status === 404) notFound();
    return <div className="text-red-600">{res.error.message}</div>;
  }
  return <div>{res.data.cooperativeName}</div>;
}
```

**Paginated list:**

```tsx
import { apiFetchList } from "@/lib/api-client";
import type { TenantRow, TenantListMeta } from "./_components/types";

const res = await apiFetchList<TenantRow, TenantListMeta>(
  `/api/tenants?page=1&pageSize=100&sort=createdAt&order=desc`,
);
const rows = res.ok ? res.data : [];
```

**Do not** create a client-side `useEffect(fetch)` or install SWR / React Query. Data flow is SSR-only.

---

## Page shell pattern

Every admin page follows the same top-level structure:

```tsx
export default function TenantsPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb items={[{ label: "Tenants" }]} />
      <h1 className="text-2xl font-semibold text-slate-900">Tenants</h1>
      <div className="border-b border-slate-200" />

      <div
        className="overflow-hidden rounded-lg bg-white shadow-sm"
        style={{ border: "1px solid var(--card-border)" }}
      >
        <div className="border-b border-[color:var(--card-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Section Title</h2>
        </div>
        <div className="p-5">
          {/* content */}
        </div>
      </div>
    </div>
  );
}
```

Copy this shell for every new page. Titles use `text-2xl font-semibold text-slate-900`; section headers inside cards use `text-base font-semibold text-slate-900`.

---

## Tables — always via `AppGrid`

```tsx
"use client";
import type { GridCustomCellProps } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { pencilIcon, trashIcon, eyeIcon } from "@progress/kendo-svg-icons";
import AppGrid, { type AppGridColumn } from "@/shared/ui/grid/app-grid";

type Row = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };

function StatusCell(props: GridCustomCellProps) {
  const row = props.dataItem as Row;
  const active = row.status === "ACTIVE";
  return (
    <td {...(props.tdProps ?? {})}>
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
      }`}>
        {active ? "Active" : "Inactive"}
      </span>
    </td>
  );
}

const CommandCell = (props: GridCustomCellProps) => {
  const row = props.dataItem as Row;
  return (
    <td {...(props.tdProps ?? {})}>
      <div className="flex items-center gap-1.5">
        <Button fillMode="flat" size="small" svgIcon={eyeIcon} />
        <Button themeColor="primary" fillMode="solid" size="small" svgIcon={pencilIcon} />
        <Button themeColor="error"   fillMode="solid" size="small" svgIcon={trashIcon} />
      </div>
    </td>
  );
};

const columns: AppGridColumn<Row>[] = [
  { field: "name", title: "Name", filter: "text" },
  { field: "status", title: "Status", width: "120px", cells: { data: StatusCell } },
  { title: "Actions", width: "160px", filterable: false, sortable: false, cells: { data: CommandCell } },
];

<AppGrid data={rows} columns={columns} filterable pageSize={10} />
```

**Rules:**

- `AppGrid` provides its own toolbar via `onAdd`/`addButtonLabel` — use it when the page has a primary "Add New" action.
- Column type shape is Kendo v15: `cells: { data: (props: GridCustomCellProps) => JSX }` — the component must render its own `<td {...(props.tdProps ?? {})}>...</td>` so Kendo can attach sticky-column / sort-indicator attributes.
- Client-side filtering is on via `filterable`. Do not add server-side URL-driven filtering to a Grid — the reference project's philosophy is "one paginated fetch loads the working set, then the Grid owns the interaction".
- Action cells use the Blackfort convention: orange edit (`themeColor="primary" fillMode="solid"`), red delete (`themeColor="error" fillMode="solid"`), flat view.

---

## Writing a form (Server Action + `useActionState`)

Forms are the primary mutation path. Server Actions call `apiFetch`, so the API layer is still authoritative — never touch Prisma from an action.

### Server Action shape

```ts
// actions/things.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { createThingSchema } from "@/lib/schemas/thing.schema";

export type FormActionState = {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
};

export async function createThingAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const parsed = createThingSchema.safeParse(values);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "_"] = i.message;
    return { error: "Please correct the highlighted fields.", fields, values };
  }

  const res = await apiFetch<{ id: string }>("/api/things", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return { error: res.error.message, fields: res.error.fields, values };

  revalidatePath("/things");
  redirect(`/things?created=1`); // → triggers a success toast via FlashToaster
}
```

### Client form using Kendo Input

```tsx
"use client";
import { useActionState, useEffect, useState } from "react";
import { Input } from "@progress/kendo-react-inputs";
import { Label } from "@progress/kendo-react-labels";
import { Button } from "@progress/kendo-react-buttons";
import { Loader } from "@progress/kendo-react-indicators";
import { createThingAction, type FormActionState } from "@/actions/things";
import { toast } from "@/shared/ui/toast/toast.store";

const initial: FormActionState = {};

export function CreateThingForm() {
  const [state, formAction, pending] = useActionState(createThingAction, initial);
  const [name, setName] = useState(state.values?.name ?? "");

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label editorId="name" className="text-xs text-slate-600">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(String(e.value ?? ""))}
          valid={!state.fields?.name}
          required
        />
        {state.fields?.name && (
          <p className="text-xs text-red-600">{state.fields.name}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" fillMode="outline">Cancel</Button>
        <Button type="submit" themeColor="primary" disabled={pending}>
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader size="small" type="pulsing" /> Saving...
            </span>
          ) : "Save"}
        </Button>
      </div>
    </form>
  );
}
```

**Rules:**

- Pre-validate in the action with the same Zod schema as the API — instant field errors, no round trip.
- Re-echo `values` back so the form doesn't lose data on validation failure.
- Kendo `Input` is controlled — hold local `useState` mirroring each field, seeded from `state.values`.
- Kendo `Input` uses `onChange={(e) => setName(String(e.value ?? ""))}` — the event carries `.value`, not `.target.value`.
- Show `valid={!error}` to trigger Kendo's inline invalid styling on the input.
- Submit button shows Kendo `Loader` while `pending`.
- Toast top-level `state.error` via `useEffect` (in addition to inline field-level errors).

---

## Toasts

Mounted once in `app/layout.tsx`:

```tsx
import AppToast from "@/shared/ui/toast/app-toast";
// …
<body>{children}<AppToast /></body>
```

Fire from anywhere client-side:

```ts
import { toast } from "@/shared/ui/toast/toast.store";
toast.success("Saved.");
toast.error("Failed to save.");
toast.warning("Careful.");
toast.info("Heads up.");
```

For Server Action redirects, use the flash-query convention:

```
/tenants/[id]?updated=1
/tenants?deleted=1
/tenants?error=<encoded message>
```

`FlashToaster` (`app/(admin)/_components/flash-toaster.tsx`) reads those params, fires the correct toast, then strips them from the URL. **Do not add ad-hoc `?foo=success` params** — extend `FlashToaster`'s map if you need a new kind.

---

## Loading and skeletons

Every route can have a `loading.tsx` next to its `page.tsx`. Next.js renders it inside a Suspense boundary while the server component streams.

Use Kendo's `Skeleton` with a `shape` and inline sizing. Match the real layout so there's no jump when the content lands:

```tsx
// app/(admin)/tenants/loading.tsx
import { Skeleton } from "@progress/kendo-react-indicators";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton shape="rectangle" style={{ width: 160, height: 16 }} />
      {/* mirror the real page structure with skeleton blocks */}
    </div>
  );
}
```

`shape` accepts `"rectangle" | "text" | "circle"`.

---

## Confirmation dialogs — always `ConfirmDialog`

Use `shared/ui/dialog/confirm-dialog.tsx` for every yes/no modal. It's a client component that renders a Kendo `Dialog` and gets state from the parent.

```tsx
"use client";
import * as React from "react";
import { Button } from "@progress/kendo-react-buttons";
import ConfirmDialog from "@/shared/ui/dialog/confirm-dialog";
import { toast } from "@/shared/ui/toast/toast.store";
import { deleteThingAction } from "@/actions/things";

export function DeleteThingButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      try { await deleteThingAction(id); }
      catch (err) {
        const message = err instanceof Error ? err.message : "Failed";
        if (!message.includes("NEXT_REDIRECT")) toast.error(message);
      } finally { setOpen(false); }
    });
  };

  return (
    <>
      <Button themeColor="error" onClick={() => setOpen(true)}>Delete</Button>
      {open && (
        <ConfirmDialog
          title="Delete Thing"
          message={`Are you sure you want to delete "${name}"?`}
          confirmLabel={pending ? "Working..." : "Delete"}
          confirmTheme="error"
          onConfirm={onConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

**Rules:**

- `confirmTheme` is `"primary" | "error" | "warning"` — pick the matching semantic.
- Wrap the action in `useTransition` and disable the parent's trigger while `pending`.
- Server Actions that call `redirect(...)` throw a `NEXT_REDIRECT` error client-side. Filter it out of the toast path.

---

## Filters (Kendo `DropDownList` / `ComboBox`)

Kendo select-style inputs take a `data` array of `{ text, value }`, controlled via `value` (the selected object) and `onChange` (event with a `.value` that is the selected object).

```tsx
"use client";
import { DropDownList, type DropDownListChangeEvent } from "@progress/kendo-react-dropdowns";

const OPTIONS = [
  { text: "All Statuses", value: "" },
  { text: "Active", value: "ACTIVE" },
  { text: "Inactive", value: "INACTIVE" },
];

const [status, setStatus] = React.useState(OPTIONS[0]);

<DropDownList
  data={OPTIONS}
  textField="text"
  dataItemKey="value"
  value={status}
  onChange={(e: DropDownListChangeEvent) => setStatus(e.value)}
  style={{ width: 180 }}
/>
```

For URL-committed filters, follow `router.push` after `setStatus` — see `tenants-grid.tsx` for a reference. Do not use plain HTML `<select>` — it will not pick up the Kendo theme.

---

## Breadcrumbs

Always via `PageBreadcrumb` from `@/shared/ui/page/page-breadcrumb`. The home crumb (orange home icon) is prepended automatically; pass everything else as `{ label, href? }`.

```tsx
<PageBreadcrumb items={[
  { label: "Tenants", href: "/tenants" },
  { label: tenant.cooperativeName },  // last item = no href = current page
]} />
```

---

## Sidebar + topbar theming rules

- Sidebar background is `var(--sidebar-bg)` (`#1e1e1e`), foreground `var(--sidebar-fg)` (near-white). Active nav item uses `var(--sidebar-accent)` (`#fdb614`) with `var(--sidebar-accent-fg)` text.
- Topbar is white on `var(--card-border)` (`rgba(36, 35, 35, 0.13)`) via Kendo `AppBar`.
- Card container: `bg-white`, `rounded-lg` or `rounded-xl`, `shadow-sm`, `border: 1px solid var(--card-border)`.
- Page background: `var(--page-bg)` (`#f6f5f5`).
- Primary accent: `themeColor="primary"` on Kendo buttons (renders orange from the theme).
- Semantic destructive: `themeColor="error"` on Kendo buttons/badges.
- Do **not** hardcode raw palette hex colors in components. If you need a new brand token, add it to `:root` in `app/globals.css` and reference it via `var(--…)`.

---

## Transitions

Kendo animations come with the theme — `Slide` for toasts, dialog open/close, dropdown popup animate-in. For page-content transitions, keep it simple: `transition-colors` on rows and links; card `hover:shadow-md` if you want a subtle lift. **Do not** install framer-motion.

---

## When client-only state is OK

Only for UI ephemera that must survive within one screen and doesn't need to reload:

- Sidebar collapse (`stores/sidebar-store.ts`, persistent)
- Dashboard widget visibility / compact mode (`stores/dashboard-ui-store.ts`, persistent)
- Open/closed state of a dialog
- Toast queue (`shared/ui/toast/toast.store.ts`)

For anything that should reload the same way, put it in the URL and render server-side.

---

## Common mistakes to avoid

- ❌ `"use client"` on a page — you'll lose SSR data fetching. Put `"use client"` on the inner component that needs interactivity.
- ❌ `useEffect(fetch)` — data comes from Server Components via `apiFetch`.
- ❌ Importing `apiFetch` in a `"use client"` file — it's server-only and will fail to build.
- ❌ Using plain `<select>` / `<button>` / `<input>` — they will not pick up the Kendo theme. Use `DropDownList`, `Button`, `Input`.
- ❌ Rendering a Kendo Grid cell without `<td {...(props.tdProps ?? {})}>` — sticky columns, sort chevrons, and hover selection will break.
- ❌ Hardcoding palette hex values — add a token to `:root` in `app/globals.css` and reference `var(--…)`.
- ❌ Two `<AppToast />` mounts — you'll see duplicate notifications.
- ❌ Skipping the pre-validate in a Server Action — pre-validating with the same Zod schema means users see field errors instantly instead of waiting for a network round trip.
- ❌ Toasting from the server — Server Actions can't call `toast(...)`. Redirect with a flash param and let `FlashToaster` fire it.
