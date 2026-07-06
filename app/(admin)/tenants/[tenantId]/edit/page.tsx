import { notFound } from "next/navigation";
import { Building2, FileText, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditTenantForm } from "./edit-form";
import { TenantsBreadcrumb } from "../../_components/tenants-breadcrumb";
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
    return <div className="text-destructive">{res.error?.message ?? "Failed to load tenant"}</div>;
  }
  const t = res.data;

  return (
    <div className="max-w-3xl space-y-4 animate-in fade-in-50 duration-300">
      <TenantsBreadcrumb
        trail={[
          { label: "Tenants", href: "/tenants", icon: Building2 },
          { label: t.cooperativeName, href: `/tenants/${t.id}`, icon: FileText },
          { label: "Edit", icon: Pencil },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Edit Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <EditTenantForm tenant={t} />
        </CardContent>
      </Card>
    </div>
  );
}
