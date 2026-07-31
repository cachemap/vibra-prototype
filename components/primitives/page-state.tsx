import type { ReactNode } from "react";
import type { BreadcrumbItem } from "./breadcrumbs";
import { PageHeader } from "./page-header";

type PageStateScaffoldProps = {
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

export function PageStateScaffold({ breadcrumbs, children }: PageStateScaffoldProps) {
  return (
    <section className="grid">
      <PageHeader breadcrumbs={breadcrumbs} border={false} />
      <div className="grid gap-4 px-[var(--page-gutter-x)] py-[var(--page-gutter-y)]">{children}</div>
    </section>
  );
}
