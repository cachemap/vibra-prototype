"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

import { db } from "../data/db";
import { seedDemoDataIfEmpty } from "../data/seed";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000
          }
        }
      })
  );

  useEffect(() => {
    void seedDemoDataIfEmpty(db).then(({ seeded }) => {
      if (seeded) {
        void queryClient.invalidateQueries();
      }
    });
  }, [queryClient]);

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
