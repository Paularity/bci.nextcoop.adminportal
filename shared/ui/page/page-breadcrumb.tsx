import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
}

export default function PageBreadcrumb({
  items,
  homeHref = "/dashboard",
}: PageBreadcrumbProps) {
  return (
    <nav className="mb-2 flex items-center gap-1.5 text-sm text-slate-500">
      <Link
        href={homeHref}
        className="flex items-center text-orange-500 transition hover:text-orange-600"
        aria-label="Home"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4v-4h2v4h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
        </svg>
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <span className="text-slate-400">›</span>
          {item.href ? (
            <Link href={item.href} className="text-slate-500 transition hover:text-slate-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
