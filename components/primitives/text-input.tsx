"use client";

import type { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cx, disabledControl } from "./class-names";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function TextInput({ className, error, id, label, ...props }: TextInputProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className="grid gap-1.5 text-sm text-gray-700" htmlFor={id}>
      {label ? <span className="font-medium">{label}</span> : null}
      <span className="relative">
        <input
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          className={cx(
            "h-[34px] w-full rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm text-gray-700 outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-purple-500/40",
            disabledControl,
            error ? "border-gray-700 pr-9" : null,
            className
          )}
          id={id}
          {...props}
        />
        {error ? (
          <AlertCircle
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-700"
          />
        ) : null}
      </span>
      {error ? (
        <span className="text-xs leading-[18px] text-gray-600" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
