import { Building2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenantForm } from "./create-form";
import { TenantsBreadcrumb } from "../_components/tenants-breadcrumb";

export default function NewTenantPage() {
  return (
    <div className="max-w-3xl space-y-4 animate-in fade-in-50 duration-300">
      <TenantsBreadcrumb
        trail={[
          { label: "Tenants", href: "/tenants", icon: Building2 },
          { label: "New", icon: PlusCircle },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Create Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
