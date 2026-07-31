"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Boxes, RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button, ThemeModeToggle } from "@/components/primitives";
import { resetDemoData } from "@/data/reset";

type WorkspaceSection = "projects" | "libraries" | null;

export function getActiveWorkspaceSection(pathname: string): WorkspaceSection {
  if (pathname.startsWith("/projects")) {
    return "projects";
  }

  if (pathname.startsWith("/libraries")) {
    return "libraries";
  }

  return null;
}

const workspaceLinkClassName = (isActive: boolean) =>
  [
    "inline-flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500/40",
    isActive
      ? "bg-gray-100 text-gray-700 shadow-sm"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
  ].join(" ");

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const activeSection = getActiveWorkspaceSection(pathname);

  const handleReset = async () => {
    setIsResetting(true);

    try {
      await resetDemoData();
      await queryClient.invalidateQueries();
      router.push("/projects");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-25 text-gray-700">
      <header className="flex h-[var(--shell-header-height)] items-center justify-between gap-2 border-b border-gray-300 bg-gray-25 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            aria-label="Open Vibra projects"
            className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500/40"
            href="/projects"
            title="Open Vibra projects"
          >
            <img alt="Vibra" className="h-8 w-auto" src="/vibra-logo.svg" />
          </Link>
          <Button
            aria-label="Reset demo"
            className="shrink-0"
            disabled={isResetting}
            leftIcon={<RotateCcw className="size-4" />}
            onClick={() => void handleReset()}
            title="Reset demo"
          >
            <span className="hidden lg:inline">{isResetting ? "Resetting" : "Reset demo"}</span>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <nav aria-label="Workspace sections" className="flex items-center gap-1">
            <Link
              aria-current={activeSection === "projects" ? "page" : undefined}
              aria-label="Projects"
              className={workspaceLinkClassName(activeSection === "projects")}
              href="/projects"
            >
              <Boxes aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link
              aria-current={activeSection === "libraries" ? "page" : undefined}
              aria-label="Libraries"
              className={workspaceLinkClassName(activeSection === "libraries")}
              href="/libraries"
            >
              <BookOpen aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Libraries</span>
            </Link>
          </nav>
          <ThemeModeToggle />
        </div>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
