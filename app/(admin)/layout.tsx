import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FlashToaster } from "@/shared/ui/toast/flash-toaster";
import { AdminShell } from "./_components/admin-shell";

const TENANT_FLASH_MESSAGES = {
  created: "Tenant created successfully.",
  updated: "Tenant updated successfully.",
  activated: "Tenant activated.",
  deactivated: "Tenant deactivated.",
  deleted: "Tenant deleted.",
} as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SYSTEM_ADMIN") redirect("/login?error=forbidden");

  const userName = session.user.name ?? "System Admin";
  const userEmail = session.user.email ?? "";

  return (
    <AdminShell userName={userName} userEmail={userEmail}>
      <Suspense fallback={null}>
        <FlashToaster messages={TENANT_FLASH_MESSAGES} />
      </Suspense>
      {children}
    </AdminShell>
  );
}
