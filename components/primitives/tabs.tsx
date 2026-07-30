import type { ReactNode } from "react";
import { cx, focusRing } from "./class-names";

export type TabItem = {
  id: string;
  label: ReactNode;
};

type TabsProps = {
  activeId: string;
  ariaLabel?: string;
  className?: string;
  items: TabItem[];
  onChange?: (id: string) => void;
};

export function Tabs({ activeId, ariaLabel, className, items, onChange }: TabsProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cx(
        "inline-flex h-[34px] max-w-full items-center rounded-lg border border-gray-300 bg-gray-50 p-0.5",
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeId;

        return (
          <button
            aria-selected={active}
            className={cx(
              "h-[28px] min-w-0 flex-1 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors",
              focusRing,
              active ? "bg-gray-25 text-purple-500 shadow-sm" : "hover:text-gray-700"
            )}
            key={item.id}
            onClick={() => onChange?.(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
