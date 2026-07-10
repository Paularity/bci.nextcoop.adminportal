"use client";

import { useState } from "react";
import {
  process,
  type CompositeFilterDescriptor,
  type SortDescriptor,
  type State,
} from "@progress/kendo-data-query";
import { Button } from "@progress/kendo-react-buttons";
import {
  Grid,
  GridColumn,
  GridToolbar,
  type GridColumnProps,
  type GridDataStateChangeEvent,
} from "@progress/kendo-react-grid";

export interface AppGridColumn<TData> extends Omit<GridColumnProps, "field" | "children"> {
  field?: keyof TData | string;
}

interface AppGridProps<TData extends object> {
  data: TData[];
  columns: AppGridColumn<TData>[];
  sortable?: boolean;
  /**
   * Enables the inline filter row plus per-column filter cells. Individual
   * columns can suppress their filter cell (`cells.filterCell = EmptyFilterCell`)
   * and instead opt into a column-header menu via `columnMenu={Component}`.
   */
  filterable?: boolean;
  pageable?: boolean;
  pageSize?: number;
  onAdd?: () => void;
  addButtonLabel?: string;
  addDisabled?: boolean;
}

const EMPTY_FILTER: CompositeFilterDescriptor = { logic: "and", filters: [] };

export default function AppGrid<TData extends object>({
  data,
  columns,
  sortable = true,
  filterable = false,
  pageable = true,
  pageSize = 5,
  onAdd,
  addButtonLabel = "Add New",
  addDisabled = false,
}: AppGridProps<TData>) {
  // Grid state: filter + sort + skip/take. `process()` slices `data` down to
  // the current page, so the Grid actually paginates instead of rendering the
  // full array. Filter/sort changes reset the pager to skip=0.
  const [dataState, setDataState] = useState<State>({
    skip: 0,
    take: pageable ? pageSize : undefined,
    filter: filterable ? EMPTY_FILTER : undefined,
    sort: [] as SortDescriptor[],
  });

  const onDataStateChange = (event: GridDataStateChangeEvent) => {
    const next: State = { ...dataState, ...event.dataState };
    // Reset to page 1 whenever the filter changes (otherwise skip could exceed
    // the filtered result count and the Grid renders an empty page).
    const filterChanged =
      JSON.stringify(next.filter ?? null) !== JSON.stringify(dataState.filter ?? null);
    if (filterChanged) next.skip = 0;
    setDataState(next);
  };

  const result = process(data as object[], dataState);

  return (
    <Grid
      // `result` is `{ data, total }` — Kendo reads both properties directly.
      data={result}
      total={result.total}
      skip={dataState.skip}
      take={dataState.take}
      pageable={pageable}
      sortable={sortable}
      sort={dataState.sort}
      filterable={filterable}
      filter={filterable ? dataState.filter : undefined}
      onDataStateChange={onDataStateChange}
    >
      {onAdd ? (
        <GridToolbar>
          <Button themeColor="primary" onClick={onAdd} disabled={addDisabled}>
            {addButtonLabel}
          </Button>
        </GridToolbar>
      ) : null}

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
