"use client";

import { ProProvider } from "@/lib/pro-context";
import { StateProvider } from "@/lib/state-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StateProvider>
      <ProProvider>{children}</ProProvider>
    </StateProvider>
  );
}
