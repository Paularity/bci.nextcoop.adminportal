import { headers } from "next/headers";

function getBaseUrl(): string {
  if (process.env.INTERNAL_API_BASE_URL) return process.env.INTERNAL_API_BASE_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
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

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: { message: string; fields?: Record<string, string> } }> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(await forwardHeaders()),
      ...(init.headers ?? {}),
    },
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
    const err = (body as { error?: { message: string; fields?: Record<string, string> } } | null)?.error ?? {
      message: `Request failed with status ${res.status}`,
    };
    return { ok: false, status: res.status, error: err };
  }

  const data = (body as { data?: T } | null)?.data;
  return { ok: true, status: res.status, data };
}
