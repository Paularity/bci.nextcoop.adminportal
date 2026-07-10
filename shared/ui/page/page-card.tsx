import type { ReactNode } from "react";

interface PageCardProps {
  children: ReactNode;
  className?: string;
}

export default function PageCard({ children, className }: PageCardProps) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
