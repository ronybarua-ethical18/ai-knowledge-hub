"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./queryClient";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Devtools must never be part of the SSR pass: it lazy-loads its panel
  // differently on the server vs. the client, which shifts every Radix
  // useId() count after it and causes hydration mismatches app-wide.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
