import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Building2, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "../_components/status-badge";
import { TenantActionDialogs } from "../_components/tenant-action-dialogs";
import { TenantsBreadcrumb } from "../_components/tenants-breadcrumb";
import type { TenantRow } from "../_components/types";

export default async function TenantDetailsPage({
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
  const isActive = t.status === "ACTIVE";

  return (
    <div className="max-w-4xl space-y-4 animate-in fade-in-50 duration-300">
      <TenantsBreadcrumb
        trail={[
          { label: "Tenants", href: "/tenants", icon: Building2 },
          { label: t.cooperativeName, icon: FileText },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{t.cooperativeName}</h1>
          <StatusBadge status={t.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/tenants/${t.id}/edit`}>Edit</Link>
          </Button>
          <TenantActionDialogs tenantId={t.id} isActive={isActive} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Cooperative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Tenant Code" value={<span className="font-mono">{t.tenantCode}</span>} />
            <Row label="Name" value={t.cooperativeName} />
            <Row label="Address" value={t.cooperativeAddress} />
            <Row label="Created" value={format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")} />
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Tenant Administrator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {t.administrator ? (
              <>
                <Row label="Name" value={`${t.administrator.firstName} ${t.administrator.lastName}`} />
                <Row label="Username" value={t.administrator.username} />
                <Row label="Email" value={t.administrator.email} />
                <Row label="Mobile" value={t.administrator.mobileNumber ?? "—"} />
              </>
            ) : (
              <p className="text-muted-foreground">No administrator assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Button asChild variant="ghost">
          <Link href="/tenants">← Back to tenants</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b last:border-0 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
