"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx, focusRing } from "./class-names";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export function Checkbox({ checked, className, disabled, id, label, ...props }: CheckboxProps) {
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
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cx(
          "flex size-4 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-25 text-gray-25 transition-colors peer-checked:border-purple-500 peer-checked:bg-purple-500 peer-disabled:border-gray-200 peer-disabled:bg-gray-100 peer-disabled:text-gray-400",
          focusRing.replaceAll("focus-visible:", "peer-focus-visible:")
        )}
      >
        <Check className="size-3" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 font-medium leading-5">{label}</span>
    </label>
  );
}
