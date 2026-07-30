"use client";

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cx, disabledControl, focusRing } from "./class-names";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  size?: "default" | "compact";
  variant?: "primary" | "secondary";
};

export function IconButton({
  className,
  disabled,
  icon: Icon,
  label,
  size = "default",
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors",
        focusRing,
        disabledControl,
        size === "default" ? "size-[34px]" : "size-[30px]",
        variant === "primary"
          ? "border-purple-500 bg-purple-500 text-gray-25 hover:border-purple-700 hover:bg-purple-700 active:border-purple-600 active:bg-purple-600"
          : "border-gray-300 bg-gray-25 text-gray-700 hover:bg-gray-300 active:bg-gray-200",
        className
      )}
      disabled={disabled}
      title={label}
      type={type}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
    </button>
  );
}
