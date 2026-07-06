"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { createTenantSchema, updateTenantSchema } from "@/lib/schemas/tenant.schema";

export type FormActionState = {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
};

function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) out[k] = String(v);
  return out;
}

export async function createTenantAction(
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const values = formToObject(formData);
  const payload = {
    tenantCode: values.tenantCode ?? "",
    cooperativeName: values.cooperativeName ?? "",
    cooperativeAddress: values.cooperativeAddress ?? "",
    administrator: {
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      email: values.email ?? "",
      mobileNumber: values.mobileNumber ?? "",
      username: values.username ?? "",
      password: values.password ?? "",
    },
  };

  const parsed = createTenantSchema.safeParse(payload);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "_"] = i.message;
    return { error: "Please correct the highlighted fields.", fields, values };
  }

  const res = await apiFetch<{ id: string }>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return {
      error: res.error?.message ?? "Failed to create tenant",
      fields: res.error?.fields,
      values,
    };
  }

  revalidatePath("/tenants");
  redirect(`/tenants?created=1`);
}

export async function updateTenantAction(
  tenantId: string,
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const values = formToObject(formData);
  const payload = {
    cooperativeName: values.cooperativeName ?? "",
    cooperativeAddress: values.cooperativeAddress ?? "",
    administrator: {
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      email: values.email ?? "",
      mobileNumber: values.mobileNumber ?? "",
    },
  };
  const parsed = updateTenantSchema.safeParse(payload);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "_"] = i.message;
    return { error: "Please correct the highlighted fields.", fields, values };
  }

  const res = await apiFetch(`/api/tenants/${tenantId}`, {
    method: "PUT",
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) {
    return { error: res.error?.message ?? "Failed to update tenant", fields: res.error?.fields, values };
  }
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath(`/tenants`);
  redirect(`/tenants/${tenantId}?updated=1`);
}

export async function activateTenantAction(tenantId: string) {
  const res = await apiFetch(`/api/tenants/${tenantId}/activate`, { method: "POST" });
  if (!res.ok) redirect(`/tenants/${tenantId}?error=${encodeURIComponent(res.error?.message ?? "Failed")}`);
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath(`/tenants`);
  redirect(`/tenants/${tenantId}?activated=1`);
}

export async function deactivateTenantAction(tenantId: string) {
  const res = await apiFetch(`/api/tenants/${tenantId}/deactivate`, { method: "POST" });
  if (!res.ok) redirect(`/tenants/${tenantId}?error=${encodeURIComponent(res.error?.message ?? "Failed")}`);
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath(`/tenants`);
  redirect(`/tenants/${tenantId}?deactivated=1`);
}

export async function deleteTenantAction(tenantId: string) {
  const res = await apiFetch(`/api/tenants/${tenantId}`, { method: "DELETE" });
  if (!res.ok) redirect(`/tenants?error=${encodeURIComponent(res.error?.message ?? "Failed")}`);
  revalidatePath(`/tenants`);
  redirect(`/tenants?deleted=1`);
}
