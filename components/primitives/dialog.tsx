import type { ReactNode } from "react";
import { cx } from "./class-names";

type DialogOverlayProps = {
  align?: "center" | "end";
  children: ReactNode;
  open?: boolean;
};

type DialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  open?: boolean;
  size?: "default" | "wide";
  title: string;
};

export function DialogOverlay({ align = "center", children, open = true }: DialogOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cx(
        "fixed inset-0 z-20 grid bg-gray-900/20 p-4 pt-20",
        align === "center" ? "place-items-start justify-items-center" : "place-items-start justify-items-end"
      )}
    >
      {children}
    </div>
  );
}

const dialogSizeClasses: Record<NonNullable<DialogProps["size"]>, string> = {
  default: "max-w-[520px]",
  wide: "max-w-[960px]"
};

export function Dialog({ actions, children, className, open = true, size = "default", title }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <section
      aria-label={title}
      className={cx(
        "w-full max-h-[calc(100vh-96px)] overflow-auto rounded-2xl border border-gray-200 bg-gray-25 p-4 shadow-lg",
        dialogSizeClasses[size],
        className
      )}
      role="dialog"
    >
      <h2 className="text-base font-semibold text-gray-700">{title}</h2>
      <div className="mt-4">{children}</div>
      {actions ? <div className="mt-8 flex justify-end gap-4">{actions}</div> : null}
    </section>
  );
}
