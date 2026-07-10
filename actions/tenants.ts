"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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

function zodErrorToFields(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const i of err.issues) fields[i.path.join(".") || "_"] = i.message;
  return fields;
}

/**
 * Shared form pipeline: (1) collect values, (2) shape the API payload,
 * (3) Zod pre-validate, (4) POST/PUT to the internal API, (5) either return
 * form state with errors for the client or redirect on success.
 */
async function submitTenantForm<S extends z.ZodTypeAny>(opts: {
  formData: FormData;
  schema: S;
  buildPayload: (values: Record<string, string>) => z.input<S>;
  method: "POST" | "PUT";
  path: string;
  errorLabel: string;
  successPath: string;
  revalidate: string[];
}): Promise<FormActionState> {
  const values = formToObject(opts.formData);
  const parsed = opts.schema.safeParse(opts.buildPayload(values));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fields: zodErrorToFields(parsed.error),
      values,
    };
  }

  const res = await apiFetch(opts.path, {
    method: opts.method,
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) {
    return {
      error: res.error?.message ?? `Failed to ${opts.errorLabel}`,
      fields: res.error?.fields,
      values,
    };
  }

  for (const p of opts.revalidate) revalidatePath(p);
  redirect(opts.successPath);
}

export async function createTenantAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  return submitTenantForm({
    formData,
    schema: createTenantSchema,
    buildPayload: (v) => ({
      tenantCode: v.tenantCode ?? "",
      cooperativeName: v.cooperativeName ?? "",
      cooperativeAddress: v.cooperativeAddress ?? "",
      administrator: {
        firstName: v.firstName ?? "",
        lastName: v.lastName ?? "",
        email: v.email ?? "",
        mobileNumber: v.mobileNumber ?? "",
        username: v.username ?? "",
        password: v.password ?? "",
      },
    }),
    method: "POST",
    path: "/api/tenants",
    errorLabel: "create tenant",
    successPath: "/tenants?created=1",
    revalidate: ["/tenants"],
  });
}

export async function updateTenantAction(
  tenantId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  return submitTenantForm({
    formData,
    schema: updateTenantSchema,
    buildPayload: (v) => ({
      cooperativeName: v.cooperativeName ?? "",
      cooperativeAddress: v.cooperativeAddress ?? "",
      administrator: {
        firstName: v.firstName ?? "",
        lastName: v.lastName ?? "",
        email: v.email ?? "",
        mobileNumber: v.mobileNumber ?? "",
      },
    }),
    method: "PUT",
    path: `/api/tenants/${tenantId}`,
    errorLabel: "update tenant",
    successPath: `/tenants/${tenantId}?updated=1`,
    revalidate: [`/tenants/${tenantId}`, "/tenants"],
  });
}

/**
 * Fire-and-redirect helper for state-change endpoints (activate / deactivate /
 * delete). Redirects with `?error=…` on failure and with the caller-provided
 * success param on success. Always throws (via `redirect`) — never returns.
 */
async function runTenantMutation(opts: {
  path: string;
  method: "POST" | "DELETE";
  errorRedirect: string;
  successRedirect: string;
  revalidate: string[];
}): Promise<never> {
  const res = await apiFetch(opts.path, { method: opts.method });
  if (!res.ok) {
    const encoded = encodeURIComponent(res.error?.message ?? "Failed");
    redirect(
      `${opts.errorRedirect}${opts.errorRedirect.includes("?") ? "&" : "?"}error=${encoded}`,
    );
  }
  for (const p of opts.revalidate) revalidatePath(p);
  redirect(opts.successRedirect);
}

export async function activateTenantAction(tenantId: string) {
  return runTenantMutation({
    path: `/api/tenants/${tenantId}/activate`,
    method: "POST",
    errorRedirect: `/tenants/${tenantId}`,
    successRedirect: `/tenants/${tenantId}?activated=1`,
    revalidate: [`/tenants/${tenantId}`, "/tenants"],
  });
}

export async function deactivateTenantAction(tenantId: string) {
  return runTenantMutation({
    path: `/api/tenants/${tenantId}/deactivate`,
    method: "POST",
    errorRedirect: `/tenants/${tenantId}`,
    successRedirect: `/tenants/${tenantId}?deactivated=1`,
    revalidate: [`/tenants/${tenantId}`, "/tenants"],
  });
}

export async function deleteTenantAction(tenantId: string) {
  return runTenantMutation({
    path: `/api/tenants/${tenantId}`,
    method: "DELETE",
    errorRedirect: "/tenants",
    successRedirect: "/tenants?deleted=1",
    revalidate: ["/tenants"],
  });
}
