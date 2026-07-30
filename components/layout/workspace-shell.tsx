"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Boxes, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/primitives";
import { resetDemoData } from "@/data/reset";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

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
      <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-300 bg-gray-25 px-4 sm:px-6">
        <Link
          aria-label="Open Vibra projects"
          className="inline-flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500/40"
          href="/projects"
          title="Open Vibra projects"
        >
          <img alt="Vibra" className="h-8 w-auto" src="/vibra-logo.svg" />
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <nav aria-label="Workspace sections" className="flex items-center gap-1">
            <Link
              className="inline-flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500/40"
              href="/projects"
            >
              <Boxes aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link
              className="inline-flex h-[34px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500/40"
              href="/libraries"
            >
              <BookOpen aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Libraries</span>
            </Link>
          </nav>
          <Button
            aria-label="Reset demo"
            disabled={isResetting}
            leftIcon={<RotateCcw className="size-4" />}
            onClick={() => void handleReset()}
            title="Reset demo"
          >
            <span className="hidden lg:inline">{isResetting ? "Resetting" : "Reset demo"}</span>
          </Button>
        </div>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
