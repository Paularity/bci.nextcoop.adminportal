"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ListFilter, CheckCircle2, CircleSlash, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const ALL = "all";

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  [ALL]: { label: "All statuses", icon: <Layers className="size-3.5 text-muted-foreground" /> },
  ACTIVE: { label: "Active", icon: <CheckCircle2 className="size-3.5 text-emerald-500" /> },
  INACTIVE: { label: "Inactive", icon: <CircleSlash className="size-3.5 text-muted-foreground" /> },
};

export function TenantSearch({
  defaultQ,
  defaultStatus,
}: {
  defaultQ?: string;
  defaultStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(defaultQ ?? "");
  const [status, setStatus] = React.useState<string>(defaultStatus || ALL);

  const commit = React.useCallback(
    (nextQ: string, nextStatus: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQ) params.set("q", nextQ);
      else params.delete("q");
      if (nextStatus && nextStatus !== ALL) params.set("status", nextStatus);
      else params.delete("status");
      params.set("page", "1");
      router.push(`/tenants?${params.toString()}`);
    },
    [router, searchParams]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commit(q, status);
  };

  const onStatusChange = (v: string | null) => {
    const next = v ?? ALL;
    setStatus(next);
    commit(q, next);
  };

  const clear = () => {
    setQ("");
    setStatus(ALL);
    router.push("/tenants");
  };

  const activeCount = (q ? 1 : 0) + (status && status !== ALL ? 1 : 0);
  const hasFilter = activeCount > 0;
  const selected = STATUS_LABEL[status] ?? STATUS_LABEL[ALL];

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 shadow-sm"
    >
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, name, admin..."
          className="h-8 border-0 bg-transparent pl-8 pr-8 shadow-none focus-visible:ring-0"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              commit("", status);
            }}
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-44 border-0 bg-transparent shadow-none focus-visible:ring-0">
          <span className="inline-flex items-center gap-2">
            <ListFilter className="size-3.5 text-muted-foreground" />
            <span className="inline-flex items-center gap-2 text-sm">
              {selected.icon}
              {selected.label}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABEL).map(([value, { label, icon }]) => (
            <SelectItem key={value} value={value}>
              <span className="inline-flex items-center gap-2">
                {icon}
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        {hasFilter && (
          <>
            <Badge variant="secondary" className="hidden font-normal sm:inline-flex">
              {activeCount} filter{activeCount === 1 ? "" : "s"}
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X /> Reset
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        <Button type="submit" size="sm">
          <Search /> Search
        </Button>
      </div>
    </form>
  );
}
