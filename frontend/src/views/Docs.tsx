"use client";

import { EyeOff, Eye, ShieldCheck, Cpu, ArrowRight, ExternalLink } from "lucide-react";
import { ADDRESSES, CC3, SEPOLIA, STABLE_UNIT } from "@/config/chains";
import { Card, CardLabel } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";

const FLOW = [
  {
    n: "01",
    phase: "Lock & Commit",
    network: "Ethereum Sepolia",
    body: "The borrower commits real-world asset collateral into the Confidential Vault. The browser maps the deposit to an eligibility tier and derives a cryptographic commitment hash C = commit(amount, salt, borrower). The exact token amount never touches the chain or the event log.",
  },
  {
    n: "02",
    phase: "Cryptographic Attestation",
    network: "Attestcoin Protocol",
    body: "Attestcoin consensus finalize the Sepolia block containing the commitment event. The off-chain proof builder constructs Merkle proofs against the state root and a header continuity proof. Creditcoin is shown cryptographic evidence of the fact, never the underlying size.",
  },
  {
    n: "03",
    phase: "Verified Settlement",
    network: "Creditcoin CC3 (ASC)",
    body: "The borrower invokes LoanBook.openLoan() on CC3. The contract verifies the proof via the BlockProver precompile (0x...FD2) in the same transaction, unpacks the tier, and activates a credit line capped at that tier in " + STABLE_UNIT + ".",
  },
];

const HIDDEN = [
  "Exact source collateral amount (units / USD)",
  "Borrower private commitment salt",
  "Portfolio inventory & asset breakdown",
  "Collateral mark-to-market size on Creditcoin",
];

const PUBLIC = [
  "Cryptographic commitment hash (bytes32)",
  "Loan tier eligibility & max credit cap",
  "Unique loan identifier (loanId)",
  "Settlement debt drawn / repaid on CC3",
  "Merkle & continuity proof bytes down to block height",
];

function AddressRow({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string | null;
}) {
  const isUrl = !!value && value.startsWith("http");
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.06] py-3.5 first:border-t-0">
      <div>
        <p className="font-display text-sm font-semibold text-snow">{label}</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mist/70">
          {note}
        </p>
      </div>
      {value === null ? (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-mist">
          Pending deploy
        </span>
      ) : isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-mint hover:underline"
        >
          {value.replace(/^https?:\/\//, "")}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        <Hash value={value} lead={10} tail={8} />
      )}
    </div>
  );
}

export default function Docs() {
  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          kicker="06 · DOCS"
          title="Documentation"
          description="Architecture & protocol mechanics. How Attora decouples collateral verification from balance sheet transparency."
        />

        {/* Problem Statement */}
        <Card className="mt-8 animate-fade-up p-8 border border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-mint" />
            <CardLabel>The Institutional Imperative</CardLabel>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-snow">
            Why Public RWA Lending Leaks the Book
          </h2>
          <p className="mt-3 font-body text-base font-light leading-relaxed text-snow/90 sm:text-[15px]">
            On a transparent ledger, posting tokenized real-world assets (treasuries, private credit, corporate debt) as collateral exposes the fund's inventory, liquidation price, and immediate cash needs. Real institutions cannot use on-chain liquidity if every loan becomes a market press release.
          </p>
          <p className="mt-2 font-body text-base font-light leading-relaxed text-mist sm:text-[15px]">
            Attora resolves this with <span className="font-medium text-snow">Confidential Underwriting</span>: borrowers lock assets on Ethereum, but only emit a blind commitment and an eligibility tier. Creditcoin verifies that the lock exists using the Attestcoin Protocol, pricing the loan strictly against the tier without ever learning the raw position size.
          </p>
        </Card>

        {/* Flow */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2 rounded-full bg-sand" />
            <CardLabel>The Protocol Lifecycle</CardLabel>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FLOW.map((s) => (
              <Card key={s.n} hover className="flex flex-col p-6 border border-white/[0.08] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-mint">{s.n}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist">
                    {s.network}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-snow">
                  {s.phase}
                </h3>
                <p className="mt-2 font-body text-xs font-light leading-relaxed text-mist">
                  {s.body}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Hidden vs public */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-6 border border-white/[0.08]">
            <div className="flex items-center gap-2 text-danger">
              <EyeOff className="size-4" />
              <CardLabel className="text-danger font-semibold">Never Exposed On-Chain</CardLabel>
            </div>
            <ul className="mt-4 space-y-3">
              {HIDDEN.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-snow/90">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-danger/80" />
                  <span className="font-light">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6 border border-white/[0.08]">
            <div className="flex items-center gap-2 text-mint">
              <Eye className="size-4" />
              <CardLabel className="text-mint font-semibold">Publicly Verified On CC3</CardLabel>
            </div>
            <ul className="mt-4 space-y-3">
              {PUBLIC.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-snow/90">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-mint shadow-[0_0_6px_rgba(148,210,189,0.7)]" />
                  <span className="font-light">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Addresses */}
        <Card className="mt-4 p-7">
          <CardLabel>Addresses</CardLabel>
          <div className="mt-3">
            <AddressRow
              label="BlockProver"
              note={`${CC3.short} precompile`}
              value={ADDRESSES.blockProver}
            />
            <AddressRow
              label="ChainInfo"
              note={`${CC3.short} precompile`}
              value={ADDRESSES.chainInfo}
            />
            <AddressRow
              label="Receipt decoder"
              note={CC3.short}
              value={ADDRESSES.decoder}
            />
            <AddressRow
              label="Proof builder"
              note="off-chain API"
              value={ADDRESSES.proofBuilder}
            />
            <AddressRow
              label="SourceVault"
              note={SEPOLIA.short}
              value={ADDRESSES.sourceVault}
            />
            <AddressRow
              label="LoanBook"
              note={CC3.short}
              value={ADDRESSES.loanBook}
            />
            <AddressRow
              label="Mock RWA"
              note={SEPOLIA.short}
              value={ADDRESSES.mockRWA}
            />
            <AddressRow
              label={`Mock ${STABLE_UNIT}`}
              note={CC3.short}
              value={ADDRESSES.mockStable}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
