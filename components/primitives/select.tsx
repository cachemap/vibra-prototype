"use client";

import type { SelectHTMLAttributes } from "react";
import { cx, disabledControl } from "./class-names";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ children, className, id, label, ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-sm text-gray-700" htmlFor={id}>
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        className={cx(
          "h-[34px] w-full rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm text-gray-700 outline-none transition-[border-color,box-shadow] focus:border-gray-300 focus:ring-2 focus:ring-purple-500/40",
          disabledControl,
          className
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
