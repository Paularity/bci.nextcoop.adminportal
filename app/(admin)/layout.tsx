import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { Topbar } from "./_components/topbar";
import { FlashToaster } from "./_components/flash-toaster";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login");
  if (role !== "SYSTEM_ADMIN") redirect("/login?error=forbidden");

  const userName = session.user.name ?? "System Admin";
  const userEmail = session.user.email ?? "";

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userEmail={userEmail} />
      <SidebarInset>
        <Topbar userName={userName} userEmail={userEmail} />
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={null}>
            <FlashToaster />
          </Suspense>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
