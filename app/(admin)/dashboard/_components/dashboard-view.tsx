"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleSlash,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@progress/kendo-react-buttons";
import {
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
} from "@progress/kendo-react-layout";
import { Badge } from "@progress/kendo-react-indicators";
import { cn } from "@/lib/utils";
import { useDashboardUIStore } from "@/stores/dashboard-ui-store";

export type DashboardData = {
  totals: {
    tenants: number;
    active: number;
    inactive: number;
  };
  recent: Array<{
    id: string;
    tenantCode: string;
    cooperativeName: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
  }>;
};

export function DashboardView({ data }: { data: DashboardData }) {
  const { compact, visibleWidgets } = useDashboardUIStore();

  return (
    <div className={cn("grid", compact ? "gap-3" : "gap-6")}>
      {visibleWidgets.stats && (
        <section className={cn("grid gap-4 sm:grid-cols-3", compact && "gap-3")}>
          <StatCard
            label="Total tenants"
            value={data.totals.tenants}
            icon={<Building2 className="size-4 text-slate-400" />}
            compact={compact}
          />
          <StatCard
            label="Active"
            value={data.totals.active}
            icon={<CheckCircle2 className="size-4 text-emerald-500" />}
            compact={compact}
          />
          <StatCard
            label="Inactive"
            value={data.totals.inactive}
            icon={<CircleSlash className="size-4 text-slate-400" />}
            compact={compact}
          />
        </section>
      )}

      {visibleWidgets.quickActions && (
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardSubtitle>Common tasks for the system administrator.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <Link href="/tenants/new">
                <Button themeColor="primary">
                  <Plus className="size-4" /> Create tenant
                </Button>
              </Link>
              <Link href="/tenants">
                <Button fillMode="outline">
                  <Building2 className="size-4" /> Browse tenants
                </Button>
              </Link>
              <Link href="/tenants?status=INACTIVE">
                <Button fillMode="outline">
                  <CircleSlash className="size-4" /> Review inactive
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {visibleWidgets.recentTenants && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent tenants</CardTitle>
              <CardSubtitle>Latest cooperatives added to the platform.</CardSubtitle>
            </div>
            <Link href="/tenants">
              <Button fillMode="flat" size="small">
                View all <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            {data.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-500">
                <Users className="size-8" />
                No tenants yet.
                <Link href="/tenants/new">
                  <Button themeColor="primary" size="small" className="mt-2">
                    Create the first one
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between gap-3 transition-colors hover:bg-slate-50",
                      compact ? "py-2" : "py-3",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tenants/${t.id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:underline"
                      >
                        {t.cooperativeName}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono">
                        {t.tenantCode}
                      </span>
                    </div>
                    <Badge
                      themeColor={t.status === "ACTIVE" ? "success" : "base"}
                      rounded="full"
                      style={{ position: "relative", padding: "2px 10px", fontSize: 11 }}
                    >
                      {t.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-slate-500 w-24 text-right">
                      {format(new Date(t.createdAt), "yyyy-MM-dd")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {!Object.values(visibleWidgets).some(Boolean) && (
        <Card>
          <CardBody className="text-center text-sm text-slate-500 py-12">
            All widgets are hidden. Turn some on from the toolbar.
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  compact,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  compact: boolean;
}) {
  return (
    <Card>
      <CardHeader className={cn("flex flex-row items-center justify-between", compact ? "pb-1" : "pb-2")}>
        <CardSubtitle>{label}</CardSubtitle>
        {icon}
      </CardHeader>
      <CardBody className={compact ? "pt-0" : undefined}>
        <div
          className={cn(
            "font-semibold tabular-nums text-slate-900",
            compact ? "text-xl" : "text-3xl",
          )}
        >
          {value.toLocaleString()}
        </div>
      </CardBody>
    </Card>
  );
}
