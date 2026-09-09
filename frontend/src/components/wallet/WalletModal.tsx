"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Wallet, X } from "lucide-react";
import { useDesk } from "@/store/desk";
import {
  discoverWallets,
  getInjectedProvider,
  KNOWN_WALLETS,
  type EIP1193Provider,
  type EIP6963ProviderDetail,
} from "@/lib/wallets";
import { cn } from "@/lib/utils";

/**
 * Wallet picker — the app's login screen. Lists every injected wallet the
 * browser announced (EIP-6963: MetaMask, Rabby, Phantom, …), a legacy
 * window.ethereum fallback, and a simulated demo wallet so the mock-first
 * build stays usable without any extension.
 */

interface Row {
  key: string;
  name: string;
  /** Data-URI icon from the wallet's announcement, when it gave one. */
  icon?: string;
  provider: EIP1193Provider | null;
  install?: string;
}

export function WalletModal() {
  const {
    walletModalOpen,
    closeWalletModal,
    connectInjected,
    connectDemo,
    connecting,
    connected,
    redirectAfterConnect,
  } = useDesk();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletModalOpen) return;
    setError(null);
    let cancelled = false;
    discoverWallets().then((announced) => {
      if (cancelled) return;
      const byRdns = new Map<string, EIP6963ProviderDetail>(
        announced.map((d) => [d.info.rdns, d]),
      );
      const next: Row[] = KNOWN_WALLETS.map((known) => {
        const detail = byRdns.get(known.rdns);
        return {
          key: known.rdns,
          name: known.name,
          icon: detail?.info.icon,
          provider: detail?.provider ?? null,
          install: known.install,
        };
      });
      // Any other announced wallet (Brave, Trust, …) gets its own row.
      for (const detail of announced) {
        if (!KNOWN_WALLETS.some((k) => k.rdns === detail.info.rdns)) {
          next.push({
            key: detail.info.rdns,
            name: detail.info.name,
            icon: detail.info.icon,
            provider: detail.provider,
          });
        }
      }
      // Legacy fallback: an injected window.ethereum that never announced.
      const injected = getInjectedProvider();
      if (injected && !announced.length) {
        next.push({
          key: "injected",
          name: "Browser wallet",
          provider: injected,
        });
      }
      setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [walletModalOpen]);

  // Close on successful connect and land where the opener asked — the
  // landing page defaults to the portfolio, "Open the desk" to the desk.
  useEffect(() => {
    if (connected && walletModalOpen) {
      const target = redirectAfterConnect ?? "/portfolio";
      closeWalletModal();
      router.push(target);
    }
  }, [connected, walletModalOpen, redirectAfterConnect, closeWalletModal, router]);

  if (!walletModalOpen) return null;

  const handleRow = async (row: Row) => {
    if (!row.provider || connecting) return;
    setError(null);
    setPending(row.key);
    try {
      await connectInjected(row.provider, row.key);
    } catch {
      setError("Connection rejected — approve the request in your wallet.");
    } finally {
      setPending(null);
    }
  };

  const anyDetected = rows.some((r) => r.provider);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="connect wallet"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={closeWalletModal}
        className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-md"
      />

      <div className="card animate-fade-up relative w-full max-w-sm p-6">
        <button
          type="button"
          onClick={closeWalletModal}
          className="btn-glass absolute right-4 top-4 grid size-8 place-items-center rounded-full"
          aria-label="Close wallet dialog"
        >
          <X className="size-4" />
        </button>

        <h2 className="font-display text-xl font-bold tracking-tight text-snow">
          connect wallet
        </h2>
        <p className="mt-1.5 font-body text-sm font-light text-mist">
          Choose an injected browser wallet to access the desk.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {rows.map((row) => {
            const detected = !!row.provider;
            const busy = pending === row.key;
            return (
              <button
                key={row.key}
                type="button"
                disabled={!detected || connecting}
                onClick={() => handleRow(row)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
                  detected
                    ? "border-white/[0.09] bg-white/[0.04] hover:border-white/[0.16] hover:bg-white/[0.07] active:scale-[0.98]"
                    : "cursor-not-allowed border-white/[0.05] bg-transparent opacity-45",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                  {row.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.icon} alt="" className="size-6" />
                  ) : (
                    <Wallet className="size-5 text-mist" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-snow">{row.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {busy
                      ? "Waiting for approval…"
                      : detected
                        ? "Detected"
                        : "Not installed"}
                  </span>
                </span>
                {busy ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-mint" />
                ) : detected ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(145,197,255,0.8)]" />
                ) : row.install ? (
                  <a
                    href={row.install}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:text-snow"
                  >
                    Install
                    <ArrowUpRight className="size-3" />
                  </a>
                ) : null}
              </button>
            );
          })}
        </div>

        {rows.length > 0 && !anyDetected && (
          <p className="mt-4 font-body text-xs font-light text-mist">
            No injected wallet detected — install MetaMask, Rabby, or Phantom,
            or continue in demo mode below.
          </p>
        )}

        <button
          type="button"
          disabled={connecting}
          onClick={connectDemo}
          className="btn-glass mt-4 h-11 w-full text-sm font-medium active:scale-[0.98]"
        >
          Continue in demo mode — simulated wallet
        </button>

        {error && (
          <p className="mt-3 text-center font-mono text-[11px] text-danger">
            {error}
          </p>
        )}

        <p className="mt-4 border-t border-white/[0.06] pt-3 text-center font-body text-[11px] font-light text-mist">
          Testnet environment only — no real financial value.
        </p>
      </div>
    </div>
  );
}
