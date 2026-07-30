import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cx } from "./class-names";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

type BreadcrumbsProps = {
  className?: string;
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cx("flex min-w-0 items-center gap-1 text-sm", className)}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;

        return (
          <div className="flex min-w-0 items-center gap-1" key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight aria-hidden="true" className="size-4 text-gray-400" /> : null}
            {item.href && !last ? (
              <Link
                className="min-w-0 truncate rounded-lg font-medium text-gray-500 outline-none transition-colors hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500/40"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cx(
                  "min-w-0 truncate font-medium",
                  last ? "text-gray-700" : "text-gray-500"
                )}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
