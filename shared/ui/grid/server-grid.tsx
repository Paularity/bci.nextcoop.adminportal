"use client";

import type { ReactNode } from "react";
import type { State } from "@progress/kendo-data-query";
import {
  Grid,
  GridColumn,
  GridToolbar,
  type GridColumnProps,
  type GridDataStateChangeEvent,
} from "@progress/kendo-react-grid";

export interface ServerGridColumn<TData> extends Omit<GridColumnProps, "field" | "children"> {
  field?: keyof TData | string;
}

interface ServerGridProps<TData extends object> {
  data: TData[];
  total: number;
  state: State;
  onStateChange: (state: State) => void;
  columns: ServerGridColumn<TData>[];
  /** Page-size choices shown in the pager selector. */
  pageSizes?: number[];
  /** Number of numeric page buttons to show. */
  buttonCount?: number;
  toolbarChildren?: ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * Reusable Kendo Grid wrapper in fully manual mode. Data + total + Kendo State
 * come in as controlled props; every Grid interaction fires `onStateChange`.
 * Pair with `useGridUrlState` to keep everything URL-driven.
 *
 * The pager renders a page-size dropdown (values from `pageSizes`), numeric
 * page buttons, and a `total` info line.
 */
export default function ServerGrid<TData extends object>({
  data,
  total,
  state,
  onStateChange,
  columns,
  pageSizes = [5, 10, 50, 100],
  buttonCount = 5,
  toolbarChildren,
  sortable = true,
  filterable = true,
}: ServerGridProps<TData>) {
  return (
    <Grid
      data={data}
      total={total}
      skip={state.skip}
      take={state.take}
      sort={state.sort}
      filter={state.filter}
      sortable={sortable}
      filterable={filterable}
      pageable={{
        pageSizes,
        buttonCount,
        info: true,
        type: "numeric",
        previousNext: true,
      }}
      onDataStateChange={(e: GridDataStateChangeEvent) => onStateChange(e.dataState)}
    >
      {toolbarChildren ? <GridToolbar>{toolbarChildren}</GridToolbar> : null}
      {columns.map((column, index) => {
        const key = `${String(column.field ?? column.title ?? "column")}-${index}`;
        return (
          <GridColumn
            key={key}
            {...column}
            field={column.field as string | undefined}
          />
        );
      })}
    </Grid>
  );
}
