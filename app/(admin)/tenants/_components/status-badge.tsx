import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" | string }) {
  const isActive = status === "ACTIVE";
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
