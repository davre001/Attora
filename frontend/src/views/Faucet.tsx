"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Coins, Droplets, Loader2, Sparkles } from "lucide-react";
import { useDesk } from "@/store/desk";
import { CC3, FAUCETS, SEPOLIA, STABLE_UNIT } from "@/config/chains";
import { mockTxHash } from "@/lib/attora";
import { Card } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

function TileShell({
  icon,
  badge,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card hover className="flex animate-fade-up flex-col p-6 border border-white/[0.08] transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-mint shadow-inner">
            {icon}
          </span>
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-snow">
              {title}
            </h3>
            <p className="mt-1 font-body text-sm font-light text-mist leading-relaxed">{subtitle}</p>
          </div>
        </div>
        {badge && (
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 pt-2">{children}</div>
    </Card>
  );
}

function LinkTile({
  icon,
  badge,
  title,
  subtitle,
  href,
  cta,
}: {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
}) {
  return (
    <TileShell icon={icon} badge={badge} title={title} subtitle={subtitle}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="btn-glass inline-flex h-11 w-full items-center justify-center gap-2 font-medium text-sm transition-all duration-200 active:scale-[0.98]"
      >
        {cta}
        <ArrowUpRight className="size-4 text-mist transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </TileShell>
  );
}

function MintTile({
  icon,
  badge,
  title,
  subtitle,
  chain,
  token,
  tokenKey,
  amount,
}: {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  subtitle: string;
  chain: typeof SEPOLIA | typeof CC3;
  token: string;
  tokenKey: "mrwa" | "musd";
  amount: number;
}) {
  const { connected, chainId, connect, switchNetwork, mint } = useDesk();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const onChain = chainId === chain.id;

  const handleMint = () => {
    setMinting(true);
    setTimeout(() => {
      setMinting(false);
      setTxHash(mockTxHash());
      mint(tokenKey, amount); // credit the Desk portfolio balances
    }, 1200);
  };

  let action: React.ReactNode;
  if (!connected) {
    action = (
      <button
        type="button"
        onClick={connect}
        className="btn-glass h-11 w-full text-sm font-medium transition-all active:scale-[0.98]"
      >
        Connect wallet to mint
      </button>
    );
  } else if (!onChain) {
    action = (
      <button
        type="button"
        onClick={() => switchNetwork(chain.id)}
        className="h-11 w-full rounded-2xl border border-sand/30 bg-sand/10 text-sm font-semibold text-sand transition-all duration-200 ease-out hover:bg-sand/20 active:scale-[0.98]"
      >
        Switch to {chain.short}
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        disabled={minting}
        onClick={handleMint}
        className="btn-proof h-11 w-full text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {minting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Minting on {chain.short}…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4" />
            Mint {amount.toLocaleString()} {token}
          </span>
        )}
      </button>
    );
  }

  return (
    <TileShell icon={icon} badge={badge} title={title} subtitle={subtitle}>
      {txHash ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-mint/20 bg-mint/[0.05] p-3.5">
          <span className="inline-flex items-center gap-1.5 font-medium text-xs text-mint">
            <Check className="size-4" />
            Successfully minted {amount.toLocaleString()} {token}
          </span>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
              Tx Hash
            </span>
            <Hash value={txHash} />
          </div>
        </div>
      ) : (
        action
      )}
    </TileShell>
  );
}

export default function Faucet() {
  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          kicker="05 · FAUCET"
          title="Faucet"
          description="Testnet asset dispenser. Request Sepolia ETH, Creditcoin CTC, and mint mock RWA tokens to test confidential commitments."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <LinkTile
            icon={<Droplets className="size-5" />}
            badge="Sepolia"
            title="Sepolia ETH"
            subtitle="Native gas token for locking RWA assets on Ethereum."
            href={FAUCETS.sepoliaEth}
            cta="Open Sepolia Faucet"
          />
          <MintTile
            icon={<Coins className="size-5" />}
            badge="Sepolia"
            title="Mock RWA Token"
            subtitle="Collateral token used to create confidential commitments."
            chain={SEPOLIA}
            token="mRWA"
            tokenKey="mrwa"
            amount={10000}
          />
          <LinkTile
            icon={<Droplets className="size-5" />}
            badge="Creditcoin CC3"
            title="Creditcoin CTC"
            subtitle="Native gas token for settlement and ASC operations on CC3."
            href={FAUCETS.cc3Ctc}
            cta="Open CC3 Faucet"
          />
          <MintTile
            icon={<Coins className="size-5" />}
            badge="Creditcoin CC3"
            title={`Mock ${STABLE_UNIT}`}
            subtitle="Stablecoin liquidity drawn against attested locks."
            chain={CC3}
            token={STABLE_UNIT}
            tokenKey="musd"
            amount={50000}
          />
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
          <p className="font-body text-xs font-light text-mist">
            Testnet environment only — no real financial value.
          </p>
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-mist transition-colors duration-200 hover:text-snow"
          >
            <ArrowLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-1" />
            Back to desk
          </Link>
        </div>
      </div>
    </section>
  );
}

