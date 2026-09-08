"use client";

import { DeskProvider } from "@/store/desk";
import { WalletModal } from "@/components/wallet/WalletModal";

/** Client boundary — the desk/wallet state machine lives behind this. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DeskProvider>
      {children}
      <WalletModal />
    </DeskProvider>
  );
}
