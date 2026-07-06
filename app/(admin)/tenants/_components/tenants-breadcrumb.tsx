import * as React from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { LucideIcon } from "lucide-react";

export type Crumb = { label: string; href?: string; icon?: LucideIcon };

export function TenantsBreadcrumb({ trail }: { trail: Crumb[] }) {
  const items: Crumb[] = [{ label: "Home", href: "/tenants", icon: Home }, ...trail];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          const Icon = c.icon;
          const inner = (
            <span className="inline-flex items-center gap-1.5">
              {Icon && <Icon className="size-3.5" />}
              <span>{c.label}</span>
            </span>
          );
          return (
            <React.Fragment key={i}>
              <BreadcrumbItem>
                {isLast || !c.href ? (
                  <BreadcrumbPage>{inner}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={c.href} />}>{inner}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
