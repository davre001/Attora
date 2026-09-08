"use client";

import { DeskProvider } from "@/store/desk";

/** Client boundary — the mock desk/wallet state machine lives behind this. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <DeskProvider>{children}</DeskProvider>;
}
