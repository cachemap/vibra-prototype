"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cx, focusRing } from "./class-names";

type ThemeOption = "light" | "system" | "dark";

const themeOptions: ReadonlyArray<{
  icon: typeof Sun;
  label: string;
  value: ThemeOption;
}> = [
  { icon: Sun, label: "Use light theme", value: "light" },
  { icon: Monitor, label: "Use system theme", value: "system" },
  { icon: Moon, label: "Use dark theme", value: "dark" }
];

const subscribeToMount = () => () => undefined;
const getClientMountState = () => true;
const getServerMountState = () => false;

export function ThemeModeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToMount, getClientMountState, getServerMountState);

  if (!mounted) {
    return <div aria-hidden="true" className={cx("h-[34px] w-[102px]", className)} />;
  }

  return (
    <div
      aria-label="Theme preference"
      className={cx("inline-flex h-[34px] rounded-lg border border-gray-300 bg-gray-25 p-0.5", className)}
      role="group"
    >
      {themeOptions.map(({ icon: Icon, label, value }) => {
        const selected = theme === value;

        return (
          <button
            aria-label={label}
            aria-pressed={selected}
            className={cx(
              "inline-flex size-7 items-center justify-center rounded-md text-gray-600 transition-colors",
              focusRing,
              selected
                ? "bg-gray-100 text-gray-700 shadow-sm"
                : "hover:bg-gray-100 hover:text-gray-700"
            )}
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            type="button"
          >
            <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
