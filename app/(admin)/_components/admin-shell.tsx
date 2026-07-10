"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, AppBarSection, AppBarSpacer } from "@progress/kendo-react-layout";
import { Popup } from "@progress/kendo-react-popup";
import { Bell, Boxes, Building2, ChevronDown, Gauge, LogOut, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useSidebarStore } from "@/stores/sidebar-store";

type NavItem = {
  text: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: NavItem[] = [
  { text: "Dashboard", href: "/dashboard", Icon: Gauge },
  { text: "Tenants", href: "/tenants", Icon: Building2 },
];

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function AdminShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded } = useSidebarStore();
  const logoutFormRef = React.useRef<HTMLFormElement>(null);
  const [avatarAnchor, setAvatarAnchor] = React.useState<HTMLElement | null>(null);
  const [avatarOpen, setAvatarOpen] = React.useState(false);

  // Close the avatar popup when clicking outside.
  React.useEffect(() => {
    if (!avatarOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (avatarAnchor && target && !avatarAnchor.contains(target)) {
        const inPopup = (target as HTMLElement).closest?.("[data-avatar-popup]");
        if (!inPopup) setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [avatarOpen, avatarAnchor]);

  const sidebarWidth = expanded ? 240 : 72;

  return (
    <div className="min-h-screen">
      <form ref={logoutFormRef} action={logoutAction} className="hidden" />

      <aside
        className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-y-auto transition-[width] duration-200 ease-in-out"
        style={{
          width: sidebarWidth,
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-fg)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-2 border-b border-white/10 px-4 pt-6 pb-5"
          style={{ minHeight: 120 }}
        >
          <div
            className="flex size-11 items-center justify-center rounded-md"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-primary-on)",
            }}
          >
            <Boxes className="size-6" />
          </div>
          {expanded && (
            <span className="text-center text-base font-semibold leading-tight">
              NextCoop Admin
            </span>
          )}
        </Link>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {ITEMS.map(({ text, href, Icon }) => {
            const active =
              href === "/tenants"
                ? pathname === "/tenants" || pathname.startsWith("/tenants/")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? text : undefined}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                style={{
                  background: active ? "var(--sidebar-accent)" : "transparent",
                  color: active ? "var(--sidebar-accent-fg)" : "var(--sidebar-fg)",
                }}
              >
                <Icon className="size-4 shrink-0" />
                {expanded && <span className="truncate">{text}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-active))",
              }}
            >
              {initials(userName)}
            </span>
            {expanded && (
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span
                  className="truncate text-xs"
                  style={{ color: "var(--sidebar-fg-dim)" }}
                >
                  {userEmail}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => logoutFormRef.current?.requestSubmit()}
              title="Sign out"
              aria-label="Sign out"
              className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div
        className="flex min-w-0 flex-col transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <AppBar
          positionMode="sticky"
          className="!bg-white border-b border-[color:var(--card-border)]"
          style={{ minHeight: 64 }}
        >
          <AppBarSpacer />

          <AppBarSection>
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-[color:var(--brand-primary)]" />
            </button>
          </AppBarSection>

          <span className="mx-3 hidden h-6 w-px bg-slate-200 sm:block" />

          <AppBarSection>
            <button
              ref={setAvatarAnchor}
              type="button"
              onClick={() => setAvatarOpen((v) => !v)}
              className="group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-slate-800 transition-colors hover:bg-slate-100"
              title="Account menu"
              aria-haspopup="menu"
              aria-expanded={avatarOpen}
            >
              <span
                className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-transform group-hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-active))",
                }}
              >
                {initials(userName)}
              </span>
              <span className="hidden flex-col leading-tight text-left sm:flex">
                <span className="truncate text-sm font-medium text-slate-900">
                  {userName}
                </span>
                <span className="truncate text-xs text-slate-500">
                  System Administrator
                </span>
              </span>
              <ChevronDown className="hidden size-4 text-slate-500 sm:inline" />
            </button>
            <Popup
              anchor={avatarAnchor ?? undefined}
              show={avatarOpen}
              popupAlign={{ horizontal: "right", vertical: "top" }}
              anchorAlign={{ horizontal: "right", vertical: "bottom" }}
              popupClass="!p-0"
            >
              <div
                data-avatar-popup
                className="mt-2 w-64 overflow-hidden rounded-md bg-white shadow-lg"
                style={{ border: "1px solid var(--card-border)" }}
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-active))",
                    }}
                  >
                    {initials(userName)}
                  </span>
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {userName}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {userEmail}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarOpen(false);
                    router.push("/tenants");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <User className="size-4 text-slate-500" />
                  Account
                </button>
                <div className="border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarOpen(false);
                    logoutFormRef.current?.requestSubmit();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </Popup>
          </AppBarSection>
        </AppBar>

        <main
          className="flex min-w-0 flex-1 flex-col p-4 sm:p-6"
          style={{ background: "var(--page-bg)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
