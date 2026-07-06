"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SUCCESS_KEYS: Record<string, string> = {
  created: "Tenant created successfully.",
  updated: "Tenant updated successfully.",
  activated: "Tenant activated.",
  deactivated: "Tenant deactivated.",
  deleted: "Tenant deleted.",
};

export function FlashToaster() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    let shown = false;
    const consumed: string[] = [];

    for (const key of Object.keys(SUCCESS_KEYS)) {
      if (searchParams.get(key)) {
        toast.success(SUCCESS_KEYS[key]);
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

    if (shown) {
      shownRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      for (const k of consumed) params.delete(k);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}
