"use client";

import { Briefcase, Coins, Cpu, DollarSign, Droplets, Gem, Landmark, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDesk, type Balances } from "@/store/desk";
import { CC3, SEPOLIA, STABLE_UNIT } from "@/config/chains";
import { formatAmount, truncateMiddle } from "@/lib/attora";
import { Card } from "@/components/ui/card";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

/**
 * Portfolio — the first page after login. Wallet holdings for every token in
 * the system, across both chains, in a horizontal grid. These are *wallet*
 * balances only: the sealed collateral amount never appears anywhere (§9 —
 * even a collateral balance delta on commit would leak the size, so the store
 * deliberately leaves balances untouched by commit()).
 */

const TOKENS: Array<{
  key: keyof Balances;
  symbol: string;
  name: string;
  role: string;
  chain: typeof SEPOLIA | typeof CC3;
  icon: LucideIcon;
  /** Mock USD price — swapped for oracle reads at the contracts milestone. */
  price: number;
}> = [
  { key: "eth", symbol: "ETH", name: "Sepolia Ether", role: "Gas", chain: SEPOLIA, icon: Droplets, price: 2_850 },
  { key: "ctc", symbol: "CTC", name: "Creditcoin", role: "Gas", chain: CC3, icon: Gem, price: 0.85 },
  { key: "gold", symbol: "XAU", name: "Gold", role: "Collateral", chain: SEPOLIA, icon: Coins, price: 2_900 },
  { key: "nvda", symbol: "NVDA", name: "NVIDIA", role: "Collateral", chain: SEPOLIA, icon: Cpu, price: 180 },
  { key: "usty", symbol: "USTY", name: "US Treasury", role: "Collateral", chain: SEPOLIA, icon: Landmark, price: 1 },
  { key: "pcr", symbol: "PCRD", name: "Private Credit", role: "Collateral", chain: SEPOLIA, icon: Briefcase, price: 1 },
  { key: "usdy", symbol: STABLE_UNIT, name: "Ondo Finance", role: "Borrowable", chain: CC3, icon: DollarSign, price: 1 },
];

/** Gas balances carry decimals; token balances are whole test units. */
function fmtBalance(n: number): string {
  return n >= 1_000
    ? formatAmount(n)
    : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** $2,850.00 / $12,500 — grouped, 2 decimals only under $1k. */
function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n >= 1_000 ? 0 : 2,
    maximumFractionDigits: n >= 1_000 ? 0 : 2,
  })}`;
}

const th =
  "px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-mist/70";
const td = "px-5 py-4";

function TokenRow({
  token,
  balance,
  connected,
}: {
  token: (typeof TOKENS)[number];
  balance: number | null;
  connected: boolean;
}) {
  const Icon = token.icon;
  const isSepolia = token.chain.id === SEPOLIA.id;
  const masked = !connected || balance === null;
  const value = masked ? null : balance * token.price;

  return (
    <tr className="group border-t border-white/[0.05] transition-colors duration-200 hover:bg-white/[0.03]">
      <td className={td}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl border transition-transform duration-300 ease-out group-hover:scale-105",
              isSepolia
                ? "border-mint/25 bg-mint/10 text-mint"
                : "border-sand/25 bg-sand/10 text-sand",
            )}
          >
            <Icon className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-snow">{token.name}</span>
            <span className="font-mono text-[11px] text-mist">{token.symbol}</span>
          </div>
        </div>
      </td>
      <td className={cn(td, "hidden sm:table-cell")}>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist">
          {token.chain.short}
        </span>
      </td>
      <td className={cn(td, "hidden md:table-cell")}>
        <span className="text-sm font-light text-mist">{token.role}</span>
      </td>
      <td className={cn(td, "text-right")}>
        {masked ? (
          <span className="font-mono text-sm text-mist/40">••••••</span>
        ) : (
          <span className="font-mono text-sm text-snow">
            {fmtBalance(balance)}
            <span className="ml-1 text-mist">{token.symbol}</span>
          </span>
        )}
      </td>
      <td className={cn(td, "text-right")}>
        {masked ? (
          <span className="font-mono text-sm text-mist/40">•••</span>
        ) : (
          <span className="font-mono text-sm text-snow/90">{fmtUsd(value ?? 0)}</span>
        )}
      </td>
    </tr>
  );
}

export default function Portfolio() {
  const { connected, address, balances, tier, openWalletModal } = useDesk();

  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          kicker="01 · PORTFOLIO"
          title="Portfolio"
          description="Your cross-chain wallet at a glance — gas, collateral, and borrowed liquidity across Ethereum Sepolia and Creditcoin CC3."
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {connected ? (
            <>
              <p className="font-body text-xs font-light text-mist">
                Wallet <span className="hash text-snow">{address ? truncateMiddle(address, 6, 4) : ""}</span>
              </p>
              {tier && <SealedChip>Collateral sealed · {tier.label}</SealedChip>}
            </>
          ) : (
            <>
              <p className="font-body text-xs font-light text-mist">
                Balances are masked until you connect.
              </p>
              <button
                type="button"
                onClick={() => openWalletModal()}
                className="btn-glass inline-flex h-9 items-center gap-2 rounded-[14px] px-4 font-body text-sm font-light transition-all duration-200 active:scale-95"
              >
                <Wallet className="size-3.5 text-mist" />
                connect wallet
              </button>
            </>
          )}
        </div>

        {/* balances table — one row per asset, columns: asset / chain / role / balance / value */}
        <Card className="mt-4 animate-fade-up overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Asset</th>
                <th className={cn(th, "hidden sm:table-cell")}>Chain</th>
                <th className={cn(th, "hidden md:table-cell")}>Role</th>
                <th className={cn(th, "text-right")}>Balance</th>
                <th className={cn(th, "text-right")}>Value</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t) => (
                <TokenRow
                  key={t.key}
                  token={t}
                  balance={balances ? balances[t.key] : null}
                  connected={connected}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                <td className={cn(td, "font-mono text-[10px] uppercase tracking-[0.14em] text-mist/70")}>
                  Total
                </td>
                <td className="hidden sm:table-cell" />
                <td className="hidden md:table-cell" />
                <td className={cn(td, "text-right font-mono text-[10px] uppercase tracking-[0.14em] text-mist/70")}>
                  {TOKENS.length} assets
                </td>
                <td className={cn(td, "text-right")}>
                  {connected && balances ? (
                    <span className="font-mono text-sm font-medium text-snow">
                      {fmtUsd(
                        TOKENS.reduce((sum, t) => sum + balances[t.key] * t.price, 0),
                      )}
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-mist/40">•••</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <p className="mt-8 border-t border-white/[0.06] pt-6 font-body text-xs font-light text-mist">
          Wallet holdings only — the size of any committed collateral stays
          sealed on the source chain and never appears here.
        </p>
      </div>
    </section>
  );
}
