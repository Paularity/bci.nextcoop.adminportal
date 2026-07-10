"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      toggle: () => set((s) => ({ expanded: !s.expanded })),
      setExpanded: (v) => set({ expanded: v }),
    }),
    { name: "nextcoop.sidebar", version: 1 },
  ),
);
