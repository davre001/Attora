import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HeroColorPanelsRoot,
  HeroColorPanelsContainer,
  HeroColorPanelsContent,
  HeroColorPanelsHeading,
  HeroColorPanelsDescription,
  HeroColorPanelsActions,
  HeroColorPanelsVisual,
  HeroColorPanelsMobileVisual,
} from "@/components/ui/hero-color-panel";

const STEPS = [
  {
    n: "01",
    title: "Commit on Sepolia",
    body: "Lock RWA collateral in a confidential vault on Ethereum. Only a commitment hash and a tier reach the chain — never the amount.",
  },
  {
    n: "02",
    title: "Attestcoin verifies",
    body: "BlockProver attests that the collateral is locked and issues a portable proof. The loan fails closed without it.",
  },
  {
    n: "03",
    title: "Borrow by tier on CC3",
    body: "Draw on Creditcoin against a proven tier. Your position shows debt and cap — the underlying size stays sealed.",
  },
];

export default function Home() {
  return (
    <>
      <HeroColorPanelsRoot
        showBadges={false}
        className="pt-8 sm:pt-12 lg:pt-16"
      >
        <HeroColorPanelsContainer>
          <HeroColorPanelsContent>
            <HeroColorPanelsHeading headingClassName="font-display" />
            <HeroColorPanelsDescription />
            <HeroColorPanelsActions>
              <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="btn-proof h-12 px-7 text-[15px] hover:opacity-95"
                >
                  <Link href="/app">Open the desk</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 px-6 text-mist transition-colors hover:bg-white/[0.06] hover:text-snow"
                >
                  <Link href="/proofs">Inspect a proof</Link>
                </Button>
              </div>
            </HeroColorPanelsActions>
          </HeroColorPanelsContent>
          <HeroColorPanelsVisual />
        </HeroColorPanelsContainer>
        <HeroColorPanelsMobileVisual />
      </HeroColorPanelsRoot>

      <section className="container pb-24 pt-4 lg:pb-28">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.n} className="card card-hover p-7">
              <span className="num text-sm text-mist">{step.n}</span>
              <h3 className="mt-3 text-lg font-medium tracking-tight text-snow">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
