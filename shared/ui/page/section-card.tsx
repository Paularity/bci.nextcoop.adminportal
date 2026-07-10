import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  bodyClassName?: string;
}

/**
 * White page card with an optional bordered title strip.
 * Use for every "labelled section" in the page shell (form cards, detail cards,
 * grid cards). If you just want a plain padded surface, use `PageCard` instead.
 */
export default function SectionCard({ title, children, bodyClassName }: SectionCardProps) {
  return (
    <div
      className="overflow-hidden rounded-lg bg-white shadow-sm"
      style={{ border: "1px solid var(--card-border)" }}
    >
      {title ? (
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--card-border)" }}
        >
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
      ) : null}
      <div className={bodyClassName ?? "p-5"}>{children}</div>
    </div>
  );
}
