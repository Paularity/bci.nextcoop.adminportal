import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16 text-center">
      <Building2 className="size-10 text-muted-foreground" />
      <h3 className="mt-3 text-base font-medium">
        {hasSearch ? "No tenants match your search" : "No tenants yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasSearch
          ? "Try a different search term or clear the filter."
          : "Create the first tenant cooperative to get started."}
      </p>
      {!hasSearch && (
        <Button asChild className="mt-4">
          <Link href="/tenants/new">Create Tenant</Link>
        </Button>
      )}
    </div>
  );
}
