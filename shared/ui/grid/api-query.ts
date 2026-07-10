/**
 * Server-side helper: convert Next.js's `searchParams` object into a
 * `URLSearchParams` suited for the internal REST API. Handles page /
 * pageSize / sort / order + resource-specific filter keys.
 *
 * Usage in a Server Component:
 * ```
 * const sp = await searchParams;
 * const query = buildApiQuery(sp, {
 *   filterKeys: ["q", "status"],
 *   defaults: { pageSize: 5, sortField: "createdAt", sortOrder: "desc" },
 * });
 * const res = await apiFetchList(`/api/tenants?${query}`);
 * ```
 */
export type ServerSearchParams = Record<string, string | string[] | undefined>;

export interface ApiQueryDefaults {
  pageSize?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

function first(sp: ServerSearchParams, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function buildApiQuery(
  sp: ServerSearchParams,
  config: { filterKeys: readonly string[]; defaults?: ApiQueryDefaults },
): URLSearchParams {
  const { filterKeys, defaults } = config;
  const params = new URLSearchParams();

  const page = Math.max(1, Number(first(sp, "page")) || 1);
  const pageSize = Math.max(
    1,
    Number(first(sp, "pageSize")) || defaults?.pageSize || 10,
  );
  const sort = first(sp, "sort") || defaults?.sortField || "";
  const orderRaw = first(sp, "order") || defaults?.sortOrder || "desc";
  const order = orderRaw === "asc" ? "asc" : "desc";

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (sort) params.set("sort", sort);
  params.set("order", order);

  for (const key of filterKeys) {
    const v = first(sp, key);
    if (v) params.set(key, v);
  }

  return params;
}
