import { redirect } from "next/navigation";

export default async function DeactivatePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  redirect(`/tenants/${tenantId}?confirm=deactivate`);
}
