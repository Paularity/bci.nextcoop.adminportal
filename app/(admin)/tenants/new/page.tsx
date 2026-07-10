import PageBreadcrumb from "@/shared/ui/page/page-breadcrumb";
import SectionCard from "@/shared/ui/page/section-card";
import { CreateTenantForm } from "./create-form";

export default function NewTenantPage() {
  return (
    <div className="space-y-4">
      <PageBreadcrumb
        items={[
          { label: "Tenants", href: "/tenants" },
          { label: "New" },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900">Create Tenant</h1>
      <div className="border-b border-slate-200" />

      <div className="mx-auto max-w-2xl">
        <SectionCard title="Tenant Details">
          <CreateTenantForm />
        </SectionCard>
      </div>
    </div>
  );
}
