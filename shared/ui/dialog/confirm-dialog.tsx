"use client";

import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Button } from "@progress/kendo-react-buttons";
import { Loader } from "@progress/kendo-react-indicators";

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTheme?: "error" | "primary" | "warning";
  /**
   * When true, both buttons are disabled and the confirm button shows a
   * loader with a "Working..." label. Cancel is also disabled so the user
   * can't dismiss the dialog mid-mutation.
   */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTheme = "error",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={() => {
        if (!pending) onCancel();
      }}
      width={400}
    >
      <p className="py-2 text-slate-700">{message}</p>
      <DialogActionsBar>
        <Button fillMode="outline" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button themeColor={confirmTheme} onClick={onConfirm} disabled={pending}>
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader size="small" type="pulsing" /> Working...
            </span>
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogActionsBar>
    </Dialog>
  );
}
