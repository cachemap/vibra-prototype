import type { ReactNode } from "react";
import type { BreadcrumbItem } from "./breadcrumbs";
import { PageHeader } from "./page-header";

type PageStateScaffoldProps = {
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

export function PageStateScaffold({ breadcrumbs, children }: PageStateScaffoldProps) {
  return (
    <section className="grid gap-4 px-4 py-5">
      <PageHeader breadcrumbs={breadcrumbs} border={false} className="px-0 py-0" />
      {children}
    </section>
  );
}
