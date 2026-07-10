import type { Metadata } from "next";
import "./globals.css";
import AppToast from "@/shared/ui/toast/app-toast";

export const metadata: Metadata = {
  title: "NextCoop System Admin Portal",
  description: "System Administrator portal for NextCoop tenants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        <AppToast />
      </body>
    </html>
  );
}
