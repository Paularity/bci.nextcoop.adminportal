import {
  composeFilters,
  enumFilter,
  textSearchFilter,
} from "@/shared/ui/grid/filter-builders";

/**
 * URL <-> Kendo filter serializer for the tenants list. Built from the
 * reusable primitives in `shared/ui/grid/filter-builders` — this file is
 * just the domain-specific composition:
 *
 * - text search across the four searchable columns (`q`, `qField`)
 * - status enum (`status = ACTIVE | INACTIVE`)
 */
export const tenantFilterSerializer = composeFilters(
  textSearchFilter({
    fields: [
      "tenantCode",
      "cooperativeName",
      "administratorName",
      "administratorEmail",
    ],
  }),
  enumFilter<"ACTIVE" | "INACTIVE">({
    field: "status",
    allowedValues: ["ACTIVE", "INACTIVE"],
  }),
);

/** URL param names owned by the tenants filter. Used by the Server Component
 *  to know which params to forward to the API. */
export const TENANT_FILTER_URL_KEYS = tenantFilterSerializer.keys;
