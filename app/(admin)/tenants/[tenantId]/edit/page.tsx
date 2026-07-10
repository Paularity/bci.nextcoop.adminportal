import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import PageBreadcrumb from "@/shared/ui/page/page-breadcrumb";
import SectionCard from "@/shared/ui/page/section-card";
import { EditTenantForm } from "./edit-form";
import type { TenantRow } from "../../_components/types";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const res = await apiFetch<TenantRow>(`/api/tenants/${tenantId}`);
  if (!res.ok || !res.data) {
    if (res.status === 404) notFound();
    return (
      <div className="text-red-600">
        {res.error?.message ?? "Failed to load tenant"}
      </div>
    );
  }
  const t = res.data;

  return (
    <div className="space-y-4">
      <PageBreadcrumb
        items={[
          { label: "Tenants", href: "/tenants" },
          { label: t.cooperativeName, href: `/tenants/${t.id}` },
          { label: "Edit" },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900">Edit Tenant</h1>
      <div className="border-b border-slate-200" />

      <div className="mx-auto max-w-2xl">
        <SectionCard title="Tenant Details">
          <EditTenantForm tenant={t} />
        </SectionCard>
      </div>
    </div>
  );
}
