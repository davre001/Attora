"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wallet } from "lucide-react";
import { Mark } from "@/components/brand/Mark";
import { useDesk } from "@/store/desk";
import { truncateMiddle } from "@/lib/attora";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/portfolio", label: "Portfolio" },
  { to: "/app", label: "Desk" },
  { to: "/positions", label: "Positions" },
  { to: "/proofs", label: "Proofs" },
  { to: "/faucet", label: "Faucet" },
  { to: "/docs", label: "Docs" },
];

/** Logo + wordmark, top-left of the bar (landing and connected shell). */
function Wordmark() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 outline-none"
      aria-label="Attora home"
    >
      <span className="transition-transform duration-300 ease-out group-hover:scale-105">
        <Mark size={28} />
      </span>
      <div className="flex flex-col">
        <span className="font-display text-[17px] font-bold tracking-[-0.03em] text-snow">
          Attora
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist/70">
          Confidential Credit
        </span>
      </div>
    </Link>
  );
}

export function Nav() {
  const { connected, address, disconnect, openWalletModal } = useDesk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // The full nav is the connected shell. Before connecting, only the landing
  // keeps a bar: wordmark top-left, connect wallet top-right.
  if (!connected) {
    if (pathname !== "/") return null;
    return (
      <header className="sticky top-0 z-50">
        <div className="border-b border-white/[0.06] bg-ink/65 backdrop-blur-2xl">
          <div className="container flex h-16 items-center justify-between">
            <Wordmark />
            <button
              type="button"
              onClick={() => openWalletModal()}
              className="btn-glass inline-flex h-9 items-center gap-2 rounded-[14px] px-4 font-body text-sm font-light transition-all duration-200 active:scale-95"
            >
              <Wallet className="size-3.5 text-mist" />
              connect wallet
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      {/* translucent glass bar over the shader */}
      <div className="border-b border-white/[0.06] bg-ink/65 backdrop-blur-2xl transition-colors">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Wordmark />

          {/* glassmorphic floating tabs */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl md:flex"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-out",
                  pathname === item.to
                    ? "border border-white/[0.14] bg-white/[0.12] text-snow shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_rgba(0,0,0,0.3)]"
                    : "text-mist hover:bg-white/[0.06] hover:text-snow active:scale-95",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* right controls: connected wallet (click to disconnect) + mobile toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={disconnect}
              title="Disconnect wallet"
              className={cn(
                "btn-glass inline-flex h-9 items-center gap-2 rounded-full border-mint/30 bg-mint/10 px-4 font-mono text-xs font-medium text-mint transition-all duration-200 hover:bg-mint/20 active:scale-95",
              )}
            >
              <Wallet className="size-3.5 text-mist" />
              <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(145,197,255,0.8)]" />
              {address ? truncateMiddle(address, 6, 4) : "Connected"}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn-glass grid size-9 place-items-center rounded-full md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* mobile glass drawer */}
        {mobileOpen && (
          <div className="border-t border-white/[0.06] bg-ink/90 p-4 backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.to
                      ? "border border-white/10 bg-white/10 text-snow"
                      : "text-mist hover:bg-white/[0.05] hover:text-snow",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
