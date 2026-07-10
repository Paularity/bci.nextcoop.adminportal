"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "./toast.store";

/**
 * Well-known flash keys the toaster recognises in `searchParams`.
 * Each maps to a success-toast message. Add more keys via the `messages`
 * prop if a resource needs its own vocabulary.
 */
export type FlashKey = "created" | "updated" | "activated" | "deactivated" | "deleted";

export type FlashMessages = Partial<Record<FlashKey, string>>;

const DEFAULT_MESSAGES: Record<FlashKey, string> = {
  created: "Created successfully.",
  updated: "Updated successfully.",
  activated: "Activated.",
  deactivated: "Deactivated.",
  deleted: "Deleted.",
};

interface FlashToasterProps {
  /**
   * Per-key overrides for the default success messages. Useful when the flash
   * fires for a specific resource — e.g. `{ created: "Tenant created successfully." }`.
   * Any keys not overridden fall back to the resource-agnostic defaults.
   */
  messages?: FlashMessages;
}

/**
 * Reads the current URL for flash query params (`?created=1`, `?updated=1`,
 * `?activated=1`, `?deactivated=1`, `?deleted=1`, or `?error=<message>`) —
 * fires the matching Kendo notification, then strips the consumed keys from
 * the URL so a refresh doesn't re-fire them.
 *
 * Reusable across resources: the URL contract and consumed keys are fixed,
 * but the success messages are overridable per mount.
 */
export function FlashToaster({ messages }: FlashToasterProps = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Guard against re-firing for the SAME url (Strict-mode double-invocation and
  // the `router.replace` re-trigger both re-run this effect with an identical
  // searchParams). A new activate/deactivate/delete arrives on a distinct URL,
  // so it will process even though this component stays mounted at the layout.
  const lastHandledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUrl = searchParams.toString();
    if (lastHandledUrlRef.current === currentUrl) return;

    const resolved = { ...DEFAULT_MESSAGES, ...messages };
    const consumed: string[] = [];
    let shown = false;

    for (const key of Object.keys(resolved) as FlashKey[]) {
      if (searchParams.get(key)) {
        toast.success(resolved[key]);
        consumed.push(key);
        shown = true;
      }
    }

    const errMsg = searchParams.get("error");
    if (errMsg) {
      toast.error(errMsg);
      consumed.push("error");
      shown = true;
    }

    // Remember this URL regardless — nothing-to-fire URLs shouldn't cause
    // repeated no-op scans on every re-render.
    lastHandledUrlRef.current = currentUrl;

    if (!shown) return;

    const params = new URLSearchParams(currentUrl);
    for (const key of consumed) params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, messages]);

  return null;
}
