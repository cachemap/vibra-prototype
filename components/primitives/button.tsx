"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx, disabledControl, focusRing } from "./class-names";

type ButtonVariant = "primary" | "secondary" | "destructive";
type ButtonSize = "default" | "compact";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-purple-500 bg-purple-500 text-gray-25 hover:border-purple-700 hover:bg-purple-700 active:border-purple-600 active:bg-purple-600",
  secondary:
    "border-gray-300 bg-gray-25 text-gray-700 hover:bg-gray-300 active:bg-gray-200",
  destructive:
    "border-gray-700 bg-gray-700 text-gray-25 hover:border-gray-800 hover:bg-gray-800 active:border-gray-600 active:bg-gray-600"
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-[34px] px-3 text-sm",
  compact: "h-[30px] px-2.5 text-xs"
};

export function Button({
  children,
  className,
  disabled,
  leftIcon,
  rightIcon,
  size = "default",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex max-w-full items-center justify-center gap-2 rounded-lg border font-semibold leading-none transition-colors",
        focusRing,
        disabledControl,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {leftIcon ? (
        <span className="flex size-4 shrink-0 items-center justify-center">{leftIcon}</span>
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon ? (
        <span className="flex size-4 shrink-0 items-center justify-center">{rightIcon}</span>
      ) : null}
    </button>
  );
}
