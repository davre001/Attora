import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-mist">
          Attora runs on Ethereum Sepolia + Creditcoin CC3 testnets.{" "}
          <span className="text-mist/70">No mainnet, no real value.</span>
        </p>
        <div className="flex items-center gap-6 text-sm text-mist">
          <Link href="/docs" className="transition-colors hover:text-snow">
            Docs
          </Link>
          <Link href="/proofs" className="transition-colors hover:text-snow">
            Proofs
          </Link>
          <span className="hash text-mist/60">CC3 · chainId 102031</span>
        </div>
      </div>
    </footer>
  );
}
