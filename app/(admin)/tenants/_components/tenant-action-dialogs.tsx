"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  activateTenantAction,
  deactivateTenantAction,
  deleteTenantAction,
} from "@/actions/tenants";

type Kind = "activate" | "deactivate" | "delete";

const COPY: Record<
  Kind,
  { title: string; description: string; confirm: string; destructive?: boolean }
> = {
  activate: {
    title: "Activate this tenant?",
    description: "The tenant administrator will regain access to their portal.",
    confirm: "Activate",
  },
  deactivate: {
    title: "Deactivate this tenant?",
    description:
      "The tenant administrator will not be able to sign in until you reactivate.",
    confirm: "Deactivate",
    destructive: true,
  },
  delete: {
    title: "Delete this tenant?",
    description:
      "This is a soft delete — the tenant will be marked deleted and set inactive. Dependent accounts and the audit trail are preserved.",
    confirm: "Delete",
    destructive: true,
  },
};

function ConfirmDialog({
  kind,
  tenantId,
  triggerButton,
}: {
  kind: Kind;
  tenantId: string;
  triggerButton: React.ReactElement;
}) {
  const copy = COPY[kind];
  const [pending, startTransition] = React.useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      try {
        if (kind === "activate") await activateTenantAction(tenantId);
        if (kind === "deactivate") await deactivateTenantAction(tenantId);
        if (kind === "delete") await deleteTenantAction(tenantId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Action failed";
        if (!message.includes("NEXT_REDIRECT")) toast.error(message);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger render={triggerButton} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={copy.destructive ? "destructive" : "default"}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Working..." : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TenantActionDialogs({
  tenantId,
  isActive,
}: {
  tenantId: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {isActive ? (
        <ConfirmDialog
          kind="deactivate"
          tenantId={tenantId}
          triggerButton={<Button variant="outline">Deactivate</Button>}
        />
      ) : (
        <ConfirmDialog
          kind="activate"
          tenantId={tenantId}
          triggerButton={<Button variant="outline">Activate</Button>}
        />
      )}
      <ConfirmDialog
        kind="delete"
        tenantId={tenantId}
        triggerButton={<Button variant="destructive">Delete</Button>}
      />
    </div>
  );
}

export function DeleteTenantDialog({
  tenantId,
  trigger,
}: {
  tenantId: string;
  trigger: React.ReactElement;
}) {
  return <ConfirmDialog kind="delete" tenantId={tenantId} triggerButton={trigger} />;
}
