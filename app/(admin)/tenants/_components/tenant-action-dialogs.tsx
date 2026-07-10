"use client";

import * as React from "react";
import { Button } from "@progress/kendo-react-buttons";
import ConfirmDialog from "@/shared/ui/dialog/confirm-dialog";
import { toast } from "@/shared/ui/toast/toast.store";
import {
  activateTenantAction,
  deactivateTenantAction,
  deleteTenantAction,
} from "@/actions/tenants";

type Kind = "activate" | "deactivate" | "delete";

const COPY: Record<
  Kind,
  { title: string; message: string; confirmLabel: string; confirmTheme: "primary" | "error" | "warning" }
> = {
  activate: {
    title: "Activate Tenant",
    message: "The tenant administrator will regain access to their portal.",
    confirmLabel: "Activate",
    confirmTheme: "primary",
  },
  deactivate: {
    title: "Deactivate Tenant",
    message:
      "The tenant administrator will not be able to sign in until you reactivate.",
    confirmLabel: "Deactivate",
    confirmTheme: "warning",
  },
  delete: {
    title: "Delete Tenant",
    message:
      "This is a soft delete — the tenant is marked deleted and set inactive. Dependent accounts and the audit trail are preserved.",
    confirmLabel: "Delete",
    confirmTheme: "error",
  },
};

export function TenantActionDialogs({
  tenantId,
  isActive,
}: {
  tenantId: string;
  isActive: boolean;
}) {
  const [target, setTarget] = React.useState<Kind | null>(null);
  const [pending, startTransition] = React.useTransition();

  const onConfirm = () => {
    if (!target) return;
    startTransition(async () => {
      try {
        if (target === "activate") await activateTenantAction(tenantId);
        else if (target === "deactivate") await deactivateTenantAction(tenantId);
        else await deleteTenantAction(tenantId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Action failed";
        if (!message.includes("NEXT_REDIRECT")) toast.error(message);
      } finally {
        setTarget(null);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <Button
            fillMode="outline"
            disabled={pending}
            onClick={() => setTarget("deactivate")}
          >
            Deactivate
          </Button>
        ) : (
          <Button
            fillMode="outline"
            disabled={pending}
            onClick={() => setTarget("activate")}
          >
            Activate
          </Button>
        )}
        <Button
          themeColor="error"
          disabled={pending}
          onClick={() => setTarget("delete")}
        >
          Delete
        </Button>
      </div>

      {target && (
        <ConfirmDialog
          title={COPY[target].title}
          message={COPY[target].message}
          confirmLabel={COPY[target].confirmLabel}
          confirmTheme={COPY[target].confirmTheme}
          pending={pending}
          onConfirm={onConfirm}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
