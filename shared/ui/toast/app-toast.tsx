"use client";

import { Notification, NotificationGroup } from "@progress/kendo-react-notification";
import { Fade } from "@progress/kendo-react-animation";
import { useToastStore, type ToastSeverity } from "./toast.store";

/**
 * Kendo `Notification.type.style` maps 1:1 to our internal severity enum,
 * so a plain identity lookup is enough — no custom colours, icons, or
 * layout of our own. Look:
 * https://www.telerik.com/kendo-react-ui/notification
 */
const KENDO_STYLE: Record<
  ToastSeverity,
  "success" | "error" | "warning" | "info"
> = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};

export default function AppToast() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <NotificationGroup
      style={{
        right: 20,
        top: 82,
        alignItems: "flex-end",
        flexWrap: "wrap-reverse",
      }}
    >
      <Fade>
        {toasts.map((t) => (
          <Notification
            key={t.id}
            type={{ style: KENDO_STYLE[t.severity], icon: true }}
            closable
            onClose={() => dismiss(t.id)}
          >
            <span>{t.message}</span>
          </Notification>
        ))}
      </Fade>
    </NotificationGroup>
  );
}
