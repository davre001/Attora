"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Copy, LogOut, Menu, X, Wallet } from "lucide-react";
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
  { to: "/analytics", label: "Analytics" },
];

/** Logo + wordmark, top-left of the bar. Landing goes home; the connected
 *  shell never links back to the landing page (logo → portfolio instead). */
function Wordmark() {
  const { connected } = useDesk();
  return (
    <Link
      href={connected ? "/portfolio" : "/"}
      className="group flex items-center gap-2.5 outline-none"
      aria-label={connected ? "Attora portfolio" : "Attora home"}
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

/** Wallet chip with a copy / logout dropdown and a logout confirmation. */
function WalletMenu({
  address,
  disconnect,
}: {
  address: string | null;
  disconnect: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirming(false);
        }}
        title="Wallet"
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-glass inline-flex h-9 items-center gap-2 rounded-full border-mint/30 bg-mint/10 px-4 font-mono text-xs font-medium text-mint transition-all duration-200 hover:bg-mint/20 active:scale-95"
      >
        <Wallet className="size-3.5 text-mist" />
        <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(145,197,255,0.8)]" />
        {address ? truncateMiddle(address, 6, 4) : "Connected"}
      </button>

      {open && (
        <div
          role="menu"
          className="glass-strong absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border border-white/[0.09] p-1.5 shadow-[0_16px_44px_rgba(0,0,0,0.5)]"
        >
          {!confirming ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={copy}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-snow transition-colors hover:bg-white/[0.06]"
              >
                {copied ? (
                  <Check className="size-4 text-mint" />
                ) : (
                  <Copy className="size-4 text-mist" />
                )}
                {copied ? "Copied" : "Copy address"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </>
          ) : (
            <div className="p-2">
              <p className="font-body text-sm text-snow">Log out of this wallet?</p>
              <p className="mt-1 font-body text-xs font-light text-mist">
                You&apos;ll need to reconnect to use the desk.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="btn-glass h-8 flex-1 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirming(false);
                    disconnect();
                    // Sign-out returns to the pre-connect landing page;
                    // replace (not push) so back can't re-enter the app shell.
                    router.replace("/");
                  }}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-danger/90 text-xs font-medium text-snow transition-colors hover:bg-danger active:scale-95"
                >
                  <LogOut className="size-3.5" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
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
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
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
                    : "text-snow/80 hover:bg-white/[0.06] hover:text-snow active:scale-95",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* right controls: connected wallet (copy / logout menu) + mobile toggle */}
          <div className="flex items-center gap-2">
            <WalletMenu address={address} disconnect={disconnect} />

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
                      : "text-snow/80 hover:bg-white/[0.05] hover:text-snow",
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
