import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { cx } from "./class-names";

type PageHeaderProps = {
  actions?: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  border?: boolean;
  className?: string;
  subtitle?: ReactNode;
  title?: ReactNode;
};

export function PageHeader({
  actions,
  breadcrumbs,
  border = true,
  className,
  subtitle,
  title
}: PageHeaderProps) {
  return (
    <header
      className={cx(
        "grid gap-3 bg-gray-25 px-[var(--page-gutter-x)] py-[var(--page-gutter-y)]",
        border && "border-b border-gray-300",
        className
      )}
    >
      <div className="grid h-[34px] grid-cols-[minmax(0,1fr)_minmax(0,50%)] items-center gap-3">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex h-[34px] min-w-0 items-center justify-end gap-2">
          {actions}
        </div>
      </div>
      {title || subtitle ? (
        <div className="min-w-0">
          {title ? <h1 className="truncate text-lg font-semibold text-gray-700">{title}</h1> : null}
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
