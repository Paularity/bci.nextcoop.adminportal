import { apiFetchList } from "@/lib/api-client";
import PageBreadcrumb from "@/shared/ui/page/page-breadcrumb";
import { DashboardToolbar } from "./_components/dashboard-toolbar";
import { DashboardView, type DashboardData } from "./_components/dashboard-view";
import type { TenantRow, TenantListMeta } from "../tenants/_components/types";

async function loadDashboard(): Promise<DashboardData> {
  const [all, active, recent] = await Promise.all([
    apiFetchList<TenantRow, TenantListMeta>(
      `/api/tenants?page=1&pageSize=1&sort=createdAt&order=desc`,
    ),
    apiFetchList<TenantRow, TenantListMeta>(
      `/api/tenants?status=ACTIVE&page=1&pageSize=1&sort=createdAt&order=desc`,
    ),
    apiFetchList<TenantRow, TenantListMeta>(
      `/api/tenants?page=1&pageSize=5&sort=createdAt&order=desc`,
    ),
  ]);

  const total = all.ok ? all.meta.total : 0;
  const activeCount = active.ok ? active.meta.total : 0;
  const inactiveCount = Math.max(0, total - activeCount);

  return {
    totals: { tenants: total, active: activeCount, inactive: inactiveCount },
    recent: recent.ok
      ? recent.data.map((t) => ({
          id: t.id,
          tenantCode: t.tenantCode,
          cooperativeName: t.cooperativeName,
          status: t.status,
          createdAt: t.createdAt,
        }))
      : [],
  };
}

export default async function DashboardPage() {
  const data = await loadDashboard();

  return (
    <div>
      <PageBreadcrumb items={[{ label: "Dashboard" }]} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
        <DashboardToolbar />
      </div>

      <DashboardView data={data} />
    </div>
  );
}
