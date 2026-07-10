import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@progress/kendo-react-buttons";
import { apiFetch } from "@/lib/api-client";
import PageBreadcrumb from "@/shared/ui/page/page-breadcrumb";
import SectionCard from "@/shared/ui/page/section-card";
import { TenantActionDialogs } from "../_components/tenant-action-dialogs";
import type { TenantRow } from "../_components/types";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1.5">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

export default async function TenantDetailsPage({
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
  const isActive = t.status === "ACTIVE";

  return (
    <div className="space-y-4">
      <PageBreadcrumb
        items={[
          { label: "Tenants", href: "/tenants" },
          { label: t.cooperativeName },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.cooperativeName}
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/tenants/${t.id}/edit`}>
            <Button themeColor="primary" fillMode="solid">
              Edit
            </Button>
          </Link>
          <TenantActionDialogs tenantId={t.id} isActive={isActive} />
        </div>
      </div>
      <div className="border-b border-slate-200" />

      <SectionCard title="Tenant Details">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Cooperative Information
        </h3>
        <div className="space-y-1">
          <InfoRow
            label="Tenant Code:"
            value={<span className="font-mono">{t.tenantCode}</span>}
          />
          <InfoRow label="Name:" value={t.cooperativeName} />
          <InfoRow label="Address:" value={t.cooperativeAddress} />
          <InfoRow
            label="Created:"
            value={format(new Date(t.createdAt), "MMMM d, yyyy")}
          />
        </div>

        <div className="my-5 border-t border-slate-200" />

        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Administrator
        </h3>
        {t.administrator ? (
          <div className="space-y-1">
            <InfoRow
              label="Name:"
              value={
                <Link
                  href="#"
                  className="font-medium underline"
                  style={{ color: "#2563eb" }}
                >
                  {t.administrator.firstName} {t.administrator.lastName}
                </Link>
              }
            />
            <InfoRow label="Username:" value={t.administrator.username} />
            <InfoRow label="Email:" value={t.administrator.email} />
            <InfoRow label="Mobile:" value={t.administrator.mobileNumber ?? "—"} />
          </div>
        ) : (
          <p className="text-slate-500">No administrator assigned.</p>
        )}
      </SectionCard>

      <div>
        <Link href="/tenants">
          <Button fillMode="flat">← Back to tenants</Button>
        </Link>
      </div>
    </div>
  );
}
