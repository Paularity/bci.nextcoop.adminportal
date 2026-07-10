"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardWidget = "stats" | "recentTenants" | "quickActions";

type DashboardUIState = {
  compact: boolean;
  visibleWidgets: Record<DashboardWidget, boolean>;
  toggleCompact: () => void;
  toggleWidget: (widget: DashboardWidget) => void;
  reset: () => void;
};

const DEFAULT_WIDGETS: Record<DashboardWidget, boolean> = {
  stats: true,
  recentTenants: true,
  quickActions: true,
};

export const useDashboardUIStore = create<DashboardUIState>()(
  persist(
    (set) => ({
      compact: false,
      visibleWidgets: DEFAULT_WIDGETS,
      toggleCompact: () => set((s) => ({ compact: !s.compact })),
      toggleWidget: (widget) =>
        set((s) => ({
          visibleWidgets: {
            ...s.visibleWidgets,
            [widget]: !s.visibleWidgets[widget],
          },
        })),
      reset: () => set({ compact: false, visibleWidgets: DEFAULT_WIDGETS }),
    }),
    {
      name: "nextcoop.dashboard-ui",
      version: 1,
    },
  ),
);
