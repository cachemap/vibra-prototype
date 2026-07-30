import type { ReactNode } from "react";
import { cx } from "./class-names";

type TooltipProps = {
  children: ReactNode;
  className?: string;
  content: ReactNode;
};

export function Tooltip({ children, className, content }: TooltipProps) {
  return (
    <span className={cx("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 max-w-64 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-25 opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}
