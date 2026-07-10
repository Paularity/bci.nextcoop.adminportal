import "server-only";
import { headers } from "next/headers";

/**
 * Server-side fetch helper for our internal REST API.
 *
 * Trade-off: because Server Components/Actions call the API via HTTP rather than
 * touching Prisma directly (per the sprint spec — PBI 24729 / AC-API-*), every
 * SSR page pays one round trip. This is a deliberate architectural choice, not
 * a bug. Do not "optimize" it away by importing prisma from a page.
 */
function getBaseUrl(): string {
  if (process.env.INTERNAL_API_BASE_URL) return process.env.INTERNAL_API_BASE_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No API base URL configured. Set INTERNAL_API_BASE_URL, NEXTAUTH_URL, or VERCEL_URL.",
    );
  }
  return "http://localhost:3000";
}

async function forwardHeaders(): Promise<HeadersInit> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  return {
    "Content-Type": "application/json",
    cookie,
  };
}

export type ApiError = { message: string; fields?: Record<string, string> };

/**
 * Perform the request + parse the body once. Both `apiFetch` and `apiFetchList`
 * differ only in how they shape the success payload — this helper owns the
 * shared "fetch, forward cookies, parse JSON, translate non-2xx to an error"
 * pipeline.
 */
async function fetchApi(
  path: string,
  init: RequestInit,
): Promise<
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: ApiError }
> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: { ...(await forwardHeaders()), ...(init.headers ?? {}) },
    cache: "no-store",
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const error =
      (body as { error?: ApiError } | null)?.error ?? {
        message: `Request failed with status ${res.status}`,
      };
    return { ok: false, status: res.status, error };
  }

  return { ok: true, status: res.status, body };
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data?: undefined; error: ApiError };

export type ApiListResult<T, M = unknown> =
  | { ok: true; status: number; data: T[]; meta: M }
  | { ok: false; status: number; data?: undefined; meta?: undefined; error: ApiError };

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetchApi(path, init);
  if (!res.ok) return res;
  const data = (res.body as { data?: T } | null)?.data as T;
  return { ok: true, status: res.status, data };
}

export async function apiFetchList<T, M = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<ApiListResult<T, M>> {
  const res = await fetchApi(path, init);
  if (!res.ok) return res;
  const shaped = res.body as { data?: T[]; meta?: M } | null;
  return {
    ok: true,
    status: res.status,
    data: (shaped?.data ?? []) as T[],
    meta: (shaped?.meta ?? ({} as M)) as M,
  };
}
