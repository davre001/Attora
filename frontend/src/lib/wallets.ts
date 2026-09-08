/**
 * EIP-6963 multi-injected-wallet discovery + injected-provider helpers.
 *
 * Real wallet connection (MetaMask / Rabby / Phantom / any injected EIP-1193
 * provider) — the first real chain touchpoint in the mock-first build. Every
 * installed wallet that supports the standard answers a dispatched
 * `eip6963:requestProvider` event with its own announce event, so several
 * wallets can coexist in one browser; the legacy `window.ethereum` singleton
 * is the fallback for wallets that never announce.
 */

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  /** Data-URI the wallet ships for itself. */
  icon: string;
  /** Reverse-domain id, e.g. "io.metamask". */
  rdns: string;
}

export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: never[]) => void): void;
  removeListener?(event: string, listener: (...args: never[]) => void): void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

/**
 * Ask every installed wallet to announce itself. Announcements are dispatched
 * synchronously during the request event, so a short settle window is enough;
 * wallets that only fire at page load have already been missed by design of
 * the standard, which is why the request is re-dispatched here.
 */
export function discoverWallets(): Promise<EIP6963ProviderDetail[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve([]);
      return;
    }
    const found = new Map<string, EIP6963ProviderDetail>();
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (detail?.info?.rdns) found.set(detail.info.rdns, detail);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve([...found.values()]);
    }, 50);
  });
}

/** Legacy single-injected-provider fallback (pre-EIP-6963 wallets). */
export function getInjectedProvider(): EIP1193Provider | null {
  const eth = (window as { ethereum?: EIP1193Provider }).ethereum;
  return eth ?? null;
}

/** Wallets always surfaced by name — detected or not. */
export const KNOWN_WALLETS = [
  {
    rdns: "io.metamask",
    name: "MetaMask",
    install: "https://metamask.io/download/",
  },
  {
    rdns: "io.rabby",
    name: "Rabby",
    install: "https://rabby.io/",
  },
  {
    rdns: "app.phantom",
    name: "Phantom",
    install: "https://phantom.app/download",
  },
] as const;
