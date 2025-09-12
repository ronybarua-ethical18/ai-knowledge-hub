"use client";

import { ReactQueryProvider } from "@/lib/react-query/ReactQueryProvider";

export function TanstackReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
