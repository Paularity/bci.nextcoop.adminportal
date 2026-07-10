"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Input } from "@progress/kendo-react-inputs";
import { Label } from "@progress/kendo-react-labels";
import { Button } from "@progress/kendo-react-buttons";
import { Loader } from "@progress/kendo-react-indicators";
import { createTenantAction, type FormActionState } from "@/actions/tenants";
import { toast } from "@/shared/ui/toast/toast.store";

const initial: FormActionState = {};

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  state,
  fieldKey,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  state: FormActionState;
  fieldKey: string;
}) {
  const err = state.fields?.[fieldKey];
  return (
    <div className="space-y-1.5">
      <Label editorId={id}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={state.values?.[name] ?? ""}
        valid={!err}
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

export function CreateTenantForm() {
  const [state, formAction, pending] = useActionState(createTenantAction, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Cooperative</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="cooperativeName" name="cooperativeName" label="Cooperative Name" required state={state} fieldKey="cooperativeName" />
          <Field id="cooperativeAddress" name="cooperativeAddress" label="Cooperative Address" required state={state} fieldKey="cooperativeAddress" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Administrator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="firstName" name="firstName" label="First Name" required state={state} fieldKey="administrator.firstName" />
          <Field id="lastName" name="lastName" label="Last Name" required state={state} fieldKey="administrator.lastName" />
          <Field id="email" name="email" type="email" label="Email" required state={state} fieldKey="administrator.email" />
          <Field id="mobileNumber" name="mobileNumber" label="Mobile Number" state={state} fieldKey="administrator.mobileNumber" />
        </div>
        <div className="text-sm text-slate-500">
          Role will be assigned as Tenant Administrator.
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="tenantCode" name="tenantCode" label="Tenant Code" required state={state} fieldKey="tenantCode" />
          <Field id="username" name="username" label="Username" required state={state} fieldKey="administrator.username" />
          <Field id="password" name="password" type="password" label="Initial Password" required state={state} fieldKey="administrator.password" />
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-4">
        <Link
          href="/tenants"
          tabIndex={pending ? -1 : undefined}
          aria-disabled={pending}
          onClick={(e) => pending && e.preventDefault()}
        >
          <Button type="button" fillMode="outline" disabled={pending}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" themeColor="primary" disabled={pending}>
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader size="small" type="pulsing" /> Creating...
            </span>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}
