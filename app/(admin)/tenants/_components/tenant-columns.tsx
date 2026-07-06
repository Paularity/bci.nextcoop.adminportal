"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DeleteTenantDialog } from "./tenant-action-dialogs";
import type { TenantRow } from "./types";

export const tenantColumns: ColumnDef<TenantRow>[] = [
  {
    accessorKey: "tenantCode",
    header: "Tenant Code",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.tenantCode}</span>,
  },
  {
    accessorKey: "cooperativeName",
    header: "Cooperative Name",
  },
  {
    id: "administrator",
    header: "Tenant Admin",
    cell: ({ row }) => {
      const a = row.original.administrator;
      return a ? `${a.firstName} ${a.lastName}` : "—";
    },
  },
  {
    id: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.administrator?.email ?? "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.createdAt), "yyyy-MM-dd")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center justify-end gap-0.5">
          <Button asChild size="icon-sm" variant="ghost" title="View">
            <Link href={`/tenants/${id}`}>
              <Eye />
            </Link>
          </Button>
          <Button asChild size="icon-sm" variant="ghost" title="Edit">
            <Link href={`/tenants/${id}/edit`}>
              <Pencil />
            </Link>
          </Button>
          <DeleteTenantDialog
            tenantId={id}
            trigger={
              <Button size="icon-sm" variant="ghost" title="Delete">
                <Trash2 />
              </Button>
            }
          />
        </div>
      );
    },
  },
];
