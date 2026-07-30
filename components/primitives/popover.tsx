import type { ReactNode } from "react";
import { cx } from "./class-names";

type PopoverProps = {
  children: ReactNode;
  className?: string;
  open?: boolean;
};

export function Popover({ children, className, open = true }: PopoverProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cx(
        "min-w-[150px] rounded-2xl border border-gray-200 bg-gray-25 p-2 shadow-lg",
        className
      )}
      role="presentation"
    >
      {children}
    </div>
  );
}
