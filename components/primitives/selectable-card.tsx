"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx, disabledControl, focusRing } from "./class-names";

type SelectableCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  description?: string;
  icon?: ReactNode;
  label: string;
};

type CardGridProps = {
  children: ReactNode;
  className?: string;
};

export function CardGrid({ children, className }: CardGridProps) {
  return <div className={cx("grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function SelectableCard({
  checked,
  className,
  description,
  disabled,
  icon,
  id,
  label,
  ...props
}: SelectableCardProps) {
  return (
    <label
      className={cx(
        "group relative block min-h-[88px] overflow-hidden rounded-xl border border-gray-300 bg-gray-25 text-gray-700 transition-colors",
        "hover:bg-gray-100 has-[:checked]:border-gray-400 has-[:checked]:bg-gray-100",
        disabled ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : "cursor-pointer",
        className
      )}
      htmlFor={id}
    >
      <input
        aria-label={label}
        checked={checked}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        id={id}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cx(
          "absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border border-gray-300 bg-gray-25 text-gray-25 transition-colors peer-checked:border-purple-500 peer-checked:bg-purple-500",
          disabledControl,
          focusRing.replaceAll("focus-visible:", "peer-focus-visible:")
        )}
      >
        <Check className="size-3.5" strokeWidth={2.4} />
      </span>
      <span className="flex min-h-[88px] items-center gap-3 p-3 pr-9">
        {icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 peer-disabled:text-gray-400">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-5">{label}</span>
          {description ? <span className="block truncate text-xs leading-[18px] text-gray-500">{description}</span> : null}
        </span>
      </span>
    </label>
  );
}
