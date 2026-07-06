"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { tenantColumns } from "./tenant-columns";
import type { TenantRow } from "./types";

const SORTABLE = new Set(["tenantCode", "cooperativeName", "status", "createdAt"]);

export function TenantTable({
  data,
  total,
  page,
  pageSize,
  sort,
  order,
}: {
  data: TenantRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sorting: SortingState = SORTABLE.has(sort)
    ? [{ id: sort, desc: order === "desc" }]
    : [];

  const table = useReactTable({
    data,
    columns: tenantColumns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    state: { sorting },
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });

  const pushParams = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`/tenants?${params.toString()}`);
  };

  const toggleSort = (columnId: string) => {
    if (!SORTABLE.has(columnId)) return;
    const nextOrder = sort === columnId && order === "asc" ? "desc" : "asc";
    pushParams({ sort: columnId, order: nextOrder, page: "1" });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="overflow-hidden rounded-t-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => {
                  const sortable = SORTABLE.has(h.column.id);
                  const isSorted = sort === h.column.id;
                  return (
                    <TableHead key={h.id}>
                      {sortable ? (
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={() => toggleSort(h.column.id)}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {isSorted ? (
                            order === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Page {page} of {totalPages} · {total} tenant{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => pushParams({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => pushParams({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
