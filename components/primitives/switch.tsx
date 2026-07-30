"use client";

import type { InputHTMLAttributes } from "react";
import { cx, focusRing } from "./class-names";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function Switch({ checked, className, disabled, id, label, ...props }: SwitchProps) {
  return (
    <label
      className={cx(
        "relative inline-flex min-h-[30px] items-center gap-2 text-sm text-gray-700",
        disabled ? "text-gray-400" : null,
        className
      )}
      htmlFor={id}
    >
      <input
        checked={checked}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        id={id}
        role="switch"
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cx(
          // Track
          "relative h-[22px] w-10 shrink-0 rounded-full border border-gray-300 bg-gray-200 shadow-[inset_0_1px_2px_rgba(24,29,39,0.08)]",
          "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
          "peer-hover:border-gray-400 peer-hover:bg-gray-300",
          // Thumb
          "after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white",
          "after:shadow-[0_1px_2px_rgba(24,29,39,0.16),0_1px_3px_rgba(24,29,39,0.10)]",
          "after:transition-transform after:duration-200 after:[transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]",
          "peer-active:after:scale-95",
          // Checked
          "peer-checked:border-purple-600 peer-checked:bg-purple-500 peer-checked:shadow-[inset_0_1px_2px_rgba(89,37,220,0.24)]",
          "peer-checked:peer-hover:border-purple-700 peer-checked:peer-hover:bg-purple-600",
          "peer-checked:after:translate-x-[18px]",
          // Disabled
          "peer-disabled:border-gray-200 peer-disabled:bg-gray-100 peer-disabled:shadow-none peer-disabled:after:bg-gray-50 peer-disabled:after:shadow-none",
          focusRing.replaceAll("focus-visible:", "peer-focus-visible:")
        )}
      />
      <span className="min-w-0 font-medium leading-5">{label}</span>
    </label>
  );
}
