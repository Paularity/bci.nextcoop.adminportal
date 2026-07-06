import { redirect } from "next/navigation";

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  redirect(`/tenants/${tenantId}?confirm=activate`);
}
