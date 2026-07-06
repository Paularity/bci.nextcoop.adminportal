import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api-client";
import { TenantSearch } from "./_components/tenant-search";
import { TenantTable } from "./_components/tenant-table";
import { EmptyState } from "./_components/empty-state";
import { TenantsBreadcrumb } from "./_components/tenants-breadcrumb";
import type { TenantListResponse } from "./_components/types";

type SP = Record<string, string | string[] | undefined>;

function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = pick(sp, "q") ?? "";
  const status = pick(sp, "status") ?? "";
  const page = Number(pick(sp, "page") ?? "1") || 1;
  const pageSize = 10;
  const sort = pick(sp, "sort") ?? "createdAt";
  const order = (pick(sp, "order") ?? "desc") as "asc" | "desc";

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("sort", sort);
  params.set("order", order);

  const res = await apiFetch<TenantListResponse>(`/api/tenants?${params.toString()}`);
  const payload = res.data ?? { data: [], total: 0, page: 1, pageSize };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <TenantsBreadcrumb trail={[{ label: "Tenants", icon: Building2 }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage cooperative tenants and their administrators.
          </p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus />
            Create Tenant
          </Link>
        </Button>
      </div>

      <Separator />

      <TenantSearch defaultQ={q} defaultStatus={status} />

      {payload.data.length === 0 ? (
        <EmptyState hasSearch={!!q || !!status} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <TenantTable
              data={payload.data}
              total={payload.total}
              page={payload.page}
              pageSize={payload.pageSize}
              sort={sort}
              order={order}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
