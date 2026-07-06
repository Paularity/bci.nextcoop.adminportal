"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateTenantAction, type FormActionState } from "@/actions/tenants";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TenantRow } from "../../_components/types";

const initial: FormActionState = {};

export function EditTenantForm({ tenant }: { tenant: TenantRow }) {
  const boundAction = updateTenantAction.bind(null, tenant.id);
  const [state, formAction, pending] = useActionState(boundAction, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const v = (k: string, fallback: string) => state.values?.[k] ?? fallback;
  const err = (k: string) => state.fields?.[k];

  return (
    <form action={formAction} className="space-y-8 animate-in fade-in-50 duration-300">
      {state.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Cooperative</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrap label="Tenant Code">
            <Input value={tenant.tenantCode} disabled className="font-mono" />
            <p className="text-xs text-muted-foreground">Tenant code cannot be changed.</p>
          </FieldWrap>
          <FieldWrap label="Cooperative Name" required error={err("cooperativeName")}>
            <Input name="cooperativeName" defaultValue={v("cooperativeName", tenant.cooperativeName)} required />
          </FieldWrap>
          <FieldWrap label="Cooperative Address" required error={err("cooperativeAddress")}>
            <Input name="cooperativeAddress" defaultValue={v("cooperativeAddress", tenant.cooperativeAddress)} required />
          </FieldWrap>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Administrator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrap label="First Name" required error={err("administrator.firstName")}>
            <Input name="firstName" defaultValue={v("firstName", tenant.administrator?.firstName ?? "")} required />
          </FieldWrap>
          <FieldWrap label="Last Name" required error={err("administrator.lastName")}>
            <Input name="lastName" defaultValue={v("lastName", tenant.administrator?.lastName ?? "")} required />
          </FieldWrap>
          <FieldWrap label="Email" required error={err("administrator.email")}>
            <Input name="email" type="email" defaultValue={v("email", tenant.administrator?.email ?? "")} required />
          </FieldWrap>
          <FieldWrap label="Mobile Number" error={err("administrator.mobileNumber")}>
            <Input name="mobileNumber" defaultValue={v("mobileNumber", tenant.administrator?.mobileNumber ?? "")} />
          </FieldWrap>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button asChild variant="outline">
          <Link href={`/tenants/${tenant.id}`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function FieldWrap({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
