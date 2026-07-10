"use client";

import { LayoutGrid, Rows3, RotateCcw } from "lucide-react";
import { Button } from "@progress/kendo-react-buttons";
import { Checkbox } from "@progress/kendo-react-inputs";
import { Popup } from "@progress/kendo-react-popup";
import * as React from "react";
import { useDashboardUIStore, type DashboardWidget } from "@/stores/dashboard-ui-store";

const WIDGET_LABELS: Record<DashboardWidget, string> = {
  stats: "Stats",
  recentTenants: "Recent tenants",
  quickActions: "Quick actions",
};

export function DashboardToolbar() {
  const { compact, toggleCompact, visibleWidgets, toggleWidget, reset } =
    useDashboardUIStore();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const visibleCount = Object.values(visibleWidgets).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      <Button fillMode="outline" size="small" onClick={toggleCompact}>
        {compact ? <LayoutGrid className="size-4" /> : <Rows3 className="size-4" />}
        {compact ? "Cozy" : "Compact"}
      </Button>

      <span ref={setAnchor}>
        <Button fillMode="outline" size="small" onClick={() => setOpen((v) => !v)}>
          Widgets ({visibleCount}/3)
        </Button>
      </span>
      <Popup
        anchor={anchor ?? undefined}
        show={open}
        popupClass="bg-white border border-slate-200 rounded-md shadow-lg p-2 w-56"
      >
        <div className="text-xs font-medium text-slate-500 px-2 py-1">Show widgets</div>
        <div className="h-px bg-slate-100 my-1" />
        {(Object.keys(WIDGET_LABELS) as DashboardWidget[]).map((w) => (
          <label
            key={w}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
          >
            <Checkbox
              value={visibleWidgets[w]}
              onChange={() => toggleWidget(w)}
            />
            <span className="text-sm">{WIDGET_LABELS[w]}</span>
          </label>
        ))}
      </Popup>

      <div className="h-6 w-px bg-slate-200" />

      <Button fillMode="flat" size="small" onClick={reset} title="Reset dashboard layout">
        <RotateCcw className="size-4" /> Reset
      </Button>
    </div>
  );
}
