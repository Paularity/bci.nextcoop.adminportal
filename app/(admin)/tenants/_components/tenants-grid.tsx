"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@progress/kendo-react-buttons";
import {
  DropDownList,
  type DropDownListChangeEvent,
} from "@progress/kendo-react-dropdowns";
import {
  eyeIcon,
  filterClearIcon,
  pencilIcon,
  plusIcon,
  trashIcon,
} from "@progress/kendo-svg-icons";
import type {
  GridCustomCellProps,
  GridCustomFilterCellProps,
} from "@progress/kendo-react-grid";
import ServerGrid, { type ServerGridColumn } from "@/shared/ui/grid/server-grid";
import { useGridUrlState } from "@/shared/ui/grid/use-grid-url-state";
import ConfirmDialog from "@/shared/ui/dialog/confirm-dialog";
import { toast } from "@/shared/ui/toast/toast.store";
import { deleteTenantAction } from "@/actions/tenants";
import { tenantFilterSerializer } from "./tenant-filter";
import type { TenantRow } from "./types";

type Row = TenantRow & {
  administratorName: string;
  administratorEmail: string;
  createdAtDate: Date;
};

// ─── Cell renderers ───────────────────────────────────────────────────────────

function StatusCell(props: GridCustomCellProps) {
  const row = props.dataItem as Row;
  const isActive = row.status === "ACTIVE";
  return (
    <td {...(props.tdProps ?? {})}>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    </td>
  );
}

// ─── Status dropdown filter cell (Kendo KB pattern) ───────────────────────────

type StatusFilterOption = { text: string; value: "ACTIVE" | "INACTIVE" | null };
const STATUS_DEFAULT_ITEM: StatusFilterOption = { text: "All", value: null };
const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { text: "Active", value: "ACTIVE" },
  { text: "Inactive", value: "INACTIVE" },
];

function StatusFilterCell(props: GridCustomFilterCellProps) {
  const currentValue =
    STATUS_FILTER_OPTIONS.find((opt) => opt.value === props.value) ??
    STATUS_DEFAULT_ITEM;
  const hasFilter =
    props.value !== null && props.value !== undefined && props.value !== "";

  const onChange = (event: DropDownListChangeEvent) => {
    const picked = event.value as StatusFilterOption;
    const active = picked.value !== STATUS_DEFAULT_ITEM.value;
    props.onChange({
      value: active ? picked.value : "",
      operator: active ? "eq" : "",
      syntheticEvent: event.syntheticEvent,
    });
  };

  const onClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    props.onChange({
      value: "",
      operator: "",
      syntheticEvent: event as unknown as React.SyntheticEvent,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        width: "100%",
        padding: "8px 8px",
        boxSizing: "border-box",
      }}
    >
      <DropDownList
        data={STATUS_FILTER_OPTIONS}
        defaultItem={STATUS_DEFAULT_ITEM}
        textField="text"
        dataItemKey="text"
        value={currentValue}
        onChange={onChange}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button
        type="button"
        title="Clear"
        fillMode="flat"
        svgIcon={filterClearIcon}
        disabled={!hasFilter}
        onClick={onClear}
      />
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface TenantsGridProps {
  data: TenantRow[];
  total: number;
}

export function TenantsGrid({ data, total }: TenantsGridProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = React.useState<Row | null>(null);
  const [pending, startTransition] = React.useTransition();

  const { state, onStateChange } = useGridUrlState({
    defaults: {
      pageSize: 5,
      sortField: "createdAt",
      sortOrder: "desc",
      pageSizes: [5, 10, 50, 100],
    },
    filter: tenantFilterSerializer,
  });

  const rows: Row[] = React.useMemo(
    () =>
      data.map((t) => ({
        ...t,
        administratorName: t.administrator
          ? `${t.administrator.firstName} ${t.administrator.lastName}`
          : "—",
        administratorEmail: t.administrator?.email ?? "—",
        createdAtDate: new Date(t.createdAt),
      })),
    [data],
  );

  const CommandCell = React.useCallback(
    (props: GridCustomCellProps) => {
      const row = props.dataItem as Row;
      return (
        <td {...(props.tdProps ?? {})}>
          <div className="flex items-center gap-1.5">
            <Link href={`/tenants/${row.id}`}>
              <Button fillMode="flat" size="small" svgIcon={eyeIcon} title="View" />
            </Link>
            <Link href={`/tenants/${row.id}/edit`}>
              <Button
                themeColor="primary"
                fillMode="solid"
                size="small"
                svgIcon={pencilIcon}
                title="Edit"
              />
            </Link>
            <Button
              themeColor="error"
              fillMode="solid"
              size="small"
              svgIcon={trashIcon}
              title="Delete"
              disabled={pending}
              onClick={() => setDeleteTarget(row)}
            />
          </div>
        </td>
      );
    },
    [pending],
  );

  const columns: ServerGridColumn<Row>[] = [
    { field: "tenantCode", title: "Tenant Code", filter: "text", width: "160px" },
    { field: "cooperativeName", title: "Cooperative Name", filter: "text" },
    { field: "administratorName", title: "Tenant Admin", filter: "text" },
    { field: "administratorEmail", title: "Email", filter: "text" },
    {
      field: "status",
      title: "Status",
      filter: "text",
      width: "180px",
      cells: { data: StatusCell, filterCell: StatusFilterCell },
    },
    {
      field: "createdAtDate",
      title: "Created",
      format: "{0:yyyy-MM-dd}",
      filterable: false,
      width: "180px",
    },
    {
      title: "Actions",
      width: "160px",
      filterable: false,
      sortable: false,
      cells: { data: CommandCell },
    },
  ];

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteTenantAction(deleteTarget.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        if (!message.includes("NEXT_REDIRECT")) toast.error(message);
      } finally {
        setDeleteTarget(null);
      }
    });
  };

  return (
    <>
      <ServerGrid
        data={rows}
        total={total}
        state={state}
        onStateChange={onStateChange}
        columns={columns}
        toolbarChildren={
          <Button
            themeColor="primary"
            svgIcon={plusIcon}
            onClick={() => router.push("/tenants/new")}
          >
            Create Tenant
          </Button>
        }
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Tenant"
          message={`Are you sure you want to delete "${deleteTarget.cooperativeName}"? This is a soft delete — audit trail is preserved.`}
          confirmLabel="Delete"
          pending={pending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
