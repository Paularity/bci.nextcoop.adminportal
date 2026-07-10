"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  CompositeFilterDescriptor,
  SortDescriptor,
  State,
} from "@progress/kendo-data-query";

/**
 * Serialises resource-specific filter state to/from URL params. Every resource
 * (tenants, products, etc.) provides its own instance — the hook itself stays
 * agnostic. `keys` lists every URL param this filter owns so the hook can
 * cleanly rewrite them on each state change.
 */
export interface GridUrlFilterSerializer {
  fromUrl(params: URLSearchParams): CompositeFilterDescriptor | undefined;
  toUrl(filter: CompositeFilterDescriptor | undefined): Record<string, string>;
  keys: readonly string[];
}

export interface GridUrlDefaults {
  pageSize?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  /** Page-size choices shown in the pager selector. */
  pageSizes?: number[];
}

interface UseGridUrlStateOptions {
  defaults?: GridUrlDefaults;
  filter?: GridUrlFilterSerializer;
}

interface UseGridUrlStateResult {
  state: State;
  onStateChange: (nextState: State) => void;
  pageSizes: number[];
}

/**
 * Wire a Kendo Grid's manual mode to the current URL. Reads page / pageSize /
 * sort / order plus resource-specific filter params, hands them back as a
 * Kendo `State`, and provides `onStateChange` that pushes new URLs when the
 * user interacts with the Grid.
 *
 * Default values are stripped from the URL to keep addresses clean.
 * Filter changes reset the page to 1 so `skip` never exceeds the new total.
 */
export function useGridUrlState({
  defaults,
  filter,
}: UseGridUrlStateOptions = {}): UseGridUrlStateResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultPageSize = defaults?.pageSize ?? 5;
  const defaultSortField = defaults?.sortField ?? "";
  const defaultSortOrder: "asc" | "desc" = defaults?.sortOrder ?? "desc";
  const pageSizes = defaults?.pageSizes ?? [5, 10, 50, 100];

  const state: State = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.max(
      1,
      Number(params.get("pageSize") ?? defaultPageSize) || defaultPageSize,
    );
    const sortField = params.get("sort") ?? defaultSortField;
    const sortOrderRaw = params.get("order") ?? defaultSortOrder;
    const sortOrder: "asc" | "desc" = sortOrderRaw === "asc" ? "asc" : "desc";
    const sort: SortDescriptor[] = sortField
      ? [{ field: sortField, dir: sortOrder }]
      : [];
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
      sort,
      filter: filter?.fromUrl(params),
    };
  }, [searchParams, defaultPageSize, defaultSortField, defaultSortOrder, filter]);

  const onStateChange = useCallback(
    (next: State) => {
      const params = new URLSearchParams(searchParams.toString());

      const setOrClear = (key: string, value: string, defaultValue: string) => {
        if (value && value !== defaultValue) params.set(key, value);
        else params.delete(key);
      };

      const nextTake = next.take ?? defaultPageSize;
      const nextSkip = next.skip ?? 0;
      const nextSort = next.sort?.[0];
      const nextFilter = next.filter as CompositeFilterDescriptor | undefined;
      const nextFilterParams = filter?.toUrl(nextFilter) ?? {};
      const currentFilterParams = filter?.toUrl(state.filter as CompositeFilterDescriptor) ?? {};

      // Any filter change resets to page 1 — otherwise `skip` could exceed the
      // filtered total and the Grid renders an empty page.
      const filterChanged =
        JSON.stringify(nextFilterParams) !== JSON.stringify(currentFilterParams);
      const nextPage = filterChanged ? 1 : Math.floor(nextSkip / nextTake) + 1;

      setOrClear("page", String(nextPage), "1");
      setOrClear("pageSize", String(nextTake), String(defaultPageSize));
      setOrClear(
        "sort",
        nextSort ? String(nextSort.field) : "",
        defaultSortField,
      );
      setOrClear(
        "order",
        (nextSort?.dir as "asc" | "desc") ?? defaultSortOrder,
        defaultSortOrder,
      );

      if (filter) {
        for (const key of filter.keys) params.delete(key);
        for (const [key, value] of Object.entries(nextFilterParams)) {
          if (value) params.set(key, value);
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [
      router,
      pathname,
      searchParams,
      defaultPageSize,
      defaultSortField,
      defaultSortOrder,
      filter,
      state.filter,
    ],
  );

  return { state, onStateChange, pageSizes };
}
