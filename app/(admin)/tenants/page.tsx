import { apiFetchList } from "@/lib/api-client";
import PageBreadcrumb from "@/shared/ui/page/page-breadcrumb";
import SectionCard from "@/shared/ui/page/section-card";
import {
  buildApiQuery,
  type ServerSearchParams,
} from "@/shared/ui/grid/api-query";
import { TenantsGrid } from "./_components/tenants-grid";
import { TENANT_FILTER_URL_KEYS } from "./_components/tenant-filter";
import type { TenantListMeta, TenantRow } from "./_components/types";

const TENANT_LIST_DEFAULTS = {
  pageSize: 5,
  sortField: "createdAt",
  sortOrder: "desc" as const,
};

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<ServerSearchParams>;
}) {
  const sp = await searchParams;
  const query = buildApiQuery(sp, {
    filterKeys: TENANT_FILTER_URL_KEYS,
    defaults: TENANT_LIST_DEFAULTS,
  });

  const res = await apiFetchList<TenantRow, TenantListMeta>(
    `/api/tenants?${query.toString()}`,
  );
  const rows: TenantRow[] = res.ok ? res.data : [];
  const total = res.ok ? Number(res.meta.total ?? 0) : 0;

  return (
    <div className="space-y-4">
      <PageBreadcrumb items={[{ label: "Tenants" }]} />
      <h1 className="text-2xl font-semibold text-slate-900">Tenants</h1>
      <div className="border-b border-slate-200" />

      <SectionCard title="Tenant Directory">
        <TenantsGrid data={rows} total={total} />
      </SectionCard>
    </div>
  );
}
