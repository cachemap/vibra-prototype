"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx, focusRing } from "./class-names";

type MenuProps = {
  children: ReactNode;
  className?: string;
};

type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  destructive?: boolean;
  icon?: ReactNode;
};

export function Menu({ children, className }: MenuProps) {
  return (
    <div
      className={cx(
        "min-w-[150px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-25 p-2 shadow-lg",
        className
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

export function MenuGroup({ children, className }: MenuProps) {
  return (
    <div className={cx("border-b border-gray-200 py-1 last:border-b-0", className)} role="group">
      {children}
    </div>
  );
}

export function MenuItem({
  children,
  className,
  destructive,
  disabled,
  icon,
  type = "button",
  ...props
}: MenuItemProps) {
  return (
    <button
      className={cx(
        "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-gray-400",
        focusRing,
        destructive
          ? "text-gray-700 hover:bg-gray-200 active:bg-gray-300"
          : "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        className
      )}
      disabled={disabled}
      role="menuitem"
      type={type}
      {...props}
    >
      {icon ? <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
