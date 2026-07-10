import type {
  CompositeFilterDescriptor,
  FilterDescriptor,
} from "@progress/kendo-data-query";
import type { GridUrlFilterSerializer } from "./use-grid-url-state";

// ─── Internals ────────────────────────────────────────────────────────────────

function flatten(filter: CompositeFilterDescriptor | undefined): FilterDescriptor[] {
  const out: FilterDescriptor[] = [];
  const walk = (node: CompositeFilterDescriptor | FilterDescriptor) => {
    if ("filters" in node) node.filters.forEach(walk);
    else out.push(node);
  };
  filter?.filters?.forEach(walk);
  return out;
}

function wrap(descriptors: FilterDescriptor[]): CompositeFilterDescriptor | undefined {
  return descriptors.length > 0 ? { logic: "and", filters: descriptors } : undefined;
}

// ─── textSearch: single-column `contains` collapsed to `(value, field)` ───────

export interface TextSearchFilterOptions {
  /** Which columns this filter is allowed to apply to. */
  fields: readonly string[];
  /** URL param that carries the search text. Default: `"q"`. */
  valueKey?: string;
  /** URL param that carries which column `q` was typed into. Default: `"qField"`. */
  fieldKey?: string;
}

/**
 * A text-search filter that lets the user filter one text column at a time.
 * When multiple text filters are present, the *first* one over an allowed
 * column wins — a documented trade-off for single-`q` API contracts.
 */
export function textSearchFilter(
  options: TextSearchFilterOptions,
): GridUrlFilterSerializer {
  const valueKey = options.valueKey ?? "q";
  const fieldKey = options.fieldKey ?? "qField";
  const allowedFields = new Set(options.fields);

  return {
    keys: [valueKey, fieldKey],

    fromUrl(params) {
      const value = params.get(valueKey) ?? "";
      const field = params.get(fieldKey) ?? "";
      if (value && field && allowedFields.has(field)) {
        return wrap([{ field, operator: "contains", value }]);
      }
      return undefined;
    },

    toUrl(filter) {
      for (const descriptor of flatten(filter)) {
        const field = String(descriptor.field ?? "");
        const value = descriptor.value;
        if (
          allowedFields.has(field) &&
          typeof value === "string" &&
          value.length > 0
        ) {
          return { [valueKey]: value, [fieldKey]: field };
        }
      }
      return {};
    },
  };
}

// ─── enum: fixed-value column filter (`status = ACTIVE`) ─────────────────────

export interface EnumFilterOptions<T extends string> {
  /** Kendo column field the filter is bound to (e.g. `"status"`). */
  field: string;
  /** URL param name. Defaults to the same as `field`. */
  urlKey?: string;
  /** Values the filter is allowed to emit; unknown values are ignored. */
  allowedValues: readonly T[];
}

/**
 * A fixed-value enum filter — the URL param is set to one of the allowed
 * values or omitted entirely (which means "no filter" / "all").
 */
export function enumFilter<T extends string>(
  options: EnumFilterOptions<T>,
): GridUrlFilterSerializer {
  const urlKey = options.urlKey ?? options.field;
  const allowed = new Set<string>(options.allowedValues);

  return {
    keys: [urlKey],

    fromUrl(params) {
      const value = params.get(urlKey) ?? "";
      if (allowed.has(value)) {
        return wrap([{ field: options.field, operator: "eq", value }]);
      }
      return undefined;
    },

    toUrl(filter) {
      for (const descriptor of flatten(filter)) {
        if (String(descriptor.field ?? "") !== options.field) continue;
        const value = descriptor.value;
        if (typeof value === "string" && allowed.has(value)) {
          return { [urlKey]: value };
        }
      }
      return {};
    },
  };
}

// ─── compose: merge multiple filter serializers ──────────────────────────────

/**
 * Combine several `GridUrlFilterSerializer`s into one that owns all their
 * URL keys, merges their filter descriptors on `fromUrl`, and merges their
 * URL param outputs on `toUrl`.
 */
export function composeFilters(
  ...filters: GridUrlFilterSerializer[]
): GridUrlFilterSerializer {
  return {
    keys: filters.flatMap((f) => f.keys),

    fromUrl(params) {
      const merged: FilterDescriptor[] = [];
      for (const f of filters) {
        const composite = f.fromUrl(params);
        merged.push(...flatten(composite));
      }
      return wrap(merged);
    },

    toUrl(filter) {
      const out: Record<string, string> = {};
      for (const f of filters) Object.assign(out, f.toUrl(filter));
      return out;
    },
  };
}
