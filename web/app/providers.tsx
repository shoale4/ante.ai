"use client";

import { ProProvider } from "@/lib/pro-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ProProvider>{children}</ProProvider>;
}
