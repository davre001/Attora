import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { GradientBackground } from "@/components/layout/GradientBackground";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Attora — Hide the size. Prove the lock. Borrow.",
  description:
    "Cross-chain confidential RWA lending. Commit collateral on Sepolia, prove the lock through Attestcoin, borrow against a tier on Creditcoin CC3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable}`}
    >
      <body>
        <Providers>
          <GradientBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
