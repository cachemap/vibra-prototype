import type { HTMLAttributes } from "react";
import { cx } from "./class-names";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "outline" | "solid";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  outline: "rounded-lg border border-gray-300 bg-gray-25 px-2 py-1",
  solid: "rounded-lg bg-gray-100 px-2 py-1"
};

export function Badge({ className, variant = "solid", ...props }: BadgeProps) {
  return <span className={cx(variantClasses[variant], className)} {...props} />;
}
