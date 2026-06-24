"use client";

import type React from "react";
import { useState } from "react";

// Inline SVG Icons for wallets
const MetaMaskIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <path fill="#e17726" d="M29.5 5.5l-3.3 8.3-4.4-4.8 7.7-3.5z" />
    <path fill="#e27625" d="M2.5 5.5l3.3 8.3 4.4-4.8-7.7-3.5z" />
    <path fill="#e47622" d="M24.7 21.3l-1.9 4.3 6.7-1.1-4.8-3.2z" />
    <path fill="#e47622" d="M7.3 21.3l1.9 4.3-6.7-1.1 4.8-3.2z" />
    <path fill="#d7c1b1" d="M21.8 9l-4.4 4.8 5.4 1 2.4-5.5z" />
    <path fill="#d7c1b1" d="M10.2 9l4.4 4.8-5.4 1-2.4-5.5z" />
    <path fill="#233447" d="M22.8 14.8l-5.4-1 1.7 4.9 3.7-3.9z" />
    <path fill="#233447" d="M9.2 14.8l5.4-1-1.7 4.9-3.7-3.9z" />
    <path fill="#e37526" d="M19.1 18.7l-3.1 3-3.1-3H7.8l5.9 7 4.6-7h.8z" />
    <path fill="#f6851b" d="M21.8 9h-1.6L16 13.2 11.8 9H10.2l-1.2 5.8 4.7 1h4.6l4.7-1-1.2-5.8z" />
  </svg>
);

const CoinbaseIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <rect width="32" height="32" rx="16" fill="#0052FF" />
    <rect x="8" y="8" width="16" height="16" rx="3.5" fill="#FFFFFF" />
  </svg>
);

const PhantomIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <rect width="32" height="32" rx="16" fill="#AB9FF2" />
    <path
      d="M22.5 13.5c0-3.3-2.7-6-6-6s-6 2.7-6 6c0 .8.2 1.6.5 2.3-.9 1.1-1.5 2.5-1.5 4.2 0 2.2 1.8 4 4 4 .8 0 1.5-.2 2.1-.6.7.4 1.5.6 2.4.6 2.2 0 4-1.8 4-4 0-1.7-.6-3.1-1.5-4.2.3-.7.5-1.5.5-2.3zm-7.5-1.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm3.5 4.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"
      fill="#FFFFFF"
    />
  </svg>
);

const TrustWalletIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <rect width="32" height="32" rx="16" fill="#0500FF" />
    <path d="M16 6.5s-6.5 2.5-6.5 5.5v6.5c0 4.5 6.5 7 6.5 7s6.5-2.5 6.5-7V12c0-3-6.5-5.5-6.5-5.5z" fill="#FFFFFF" />
  </svg>
);

const OKXIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <rect width="32" height="32" rx="16" fill="#000000" />
    <path
      d="M7 7h5v5H7V7zm6 0h6v6h-6V7zm7 0h5v5h-5V7zM7 13h5v6H7v-6zm6 0h6v6h-6v-6zm7 0h5v6h-5v-6zM7 20h5v5H7v-5zm6 0h6v5h-6v-5zm7 0h5v5h-5v-5z"
      fill="#FFFFFF"
    />
  </svg>
);

const BraveIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28">
    <rect width="32" height="32" rx="16" fill="#FF4500" />
    <path d="M16 6.5l8.5 14-8.5 5-8.5-5z" fill="#FFFFFF" />
  </svg>
);

const InjectedIcon = () => (
  <svg
    viewBox="0 0 32 32"
    width="28"
    height="28"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="32" height="32" rx="16" fill="#2A2C35" stroke="none" />
    <rect x="8" y="10" width="16" height="12" rx="2" stroke="#FFFFFF" />
    <path d="M16 14h4v4h-4z" fill="#FFFFFF" />
  </svg>
);

const walletsList = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: <MetaMaskIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(window.ethereum?.isMetaMask || window.ethereum?.providers?.some((p: any) => p.isMetaMask)),
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: <CoinbaseIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(
        window.coinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbase ||
        window.ethereum?.providers?.some((p: any) => p.isCoinbaseWallet || p.isCoinbase)
      ),
    installUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: <PhantomIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(
        window.phantom?.ethereum ||
        window.ethereum?.isPhantom ||
        window.ethereum?.providers?.some((p: any) => p.isPhantom)
      ),
    installUrl: "https://phantom.app/download",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: <TrustWalletIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(
        window.trustWallet ||
        window.ethereum?.isTrust ||
        window.ethereum?.isTrustWallet ||
        window.ethereum?.providers?.some((p: any) => p.isTrust || p.isTrustWallet)
      ),
    installUrl: "https://trustwallet.com/download",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: <OKXIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(
        window.okxwallet ||
        window.ethereum?.isOKX ||
        window.ethereum?.isOKXHeaders ||
        window.ethereum?.providers?.some((p: any) => p.isOKX || p.isOKXHeaders)
      ),
    installUrl: "https://www.okx.com/web3",
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: <BraveIcon />,
    checkInstalled: () =>
      typeof window !== "undefined" &&
      !!(window.ethereum?.isBraveWallet || window.ethereum?.providers?.some((p: any) => p.isBraveWallet)),
    installUrl: "https://brave.com/wallet/",
  },
  {
    id: "injected",
    name: "Injected Wallet",
    icon: <InjectedIcon />,
    checkInstalled: () => typeof window !== "undefined" && !!window.ethereum,
    installUrl: null,
  },
];

interface Wallet {
  id: string;
  name: string;
  icon: React.ReactNode;
  checkInstalled: () => boolean;
  installUrl: string | null;
}

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
  isConnecting: boolean;
  connectingWalletId: string | null;
}

import { AlertCircle, ChevronRight, ExternalLink, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WalletConnectModal({
  isOpen,
  onClose,
  onConnect,
  isConnecting,
  connectingWalletId,
}: WalletConnectModalProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [notInstalledWallet, setNotInstalledWallet] = useState<Wallet | null>(null);

  const handleWalletSelect = (wallet: Wallet) => {
    setErrorMsg("");
    setNotInstalledWallet(null);

    // 1. Detect if the user is on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      const dAppUrl = window.location.href;
      const cleanUrl = dAppUrl.replace(/^https?:\/\//, "");

      if (wallet.id === "metamask") {
        window.location.assign(`https://metamask.app.link/dapp/${cleanUrl}`);
        return;
      }
      if (wallet.id === "trust") {
        const encodedUrl = encodeURIComponent(dAppUrl);
        window.location.assign(`https://link.trustwallet.com/open_url?coin_id=60&url=${encodedUrl}`);
        return;
      }
      if (wallet.id === "coinbase") {
        const encodedUrl = encodeURIComponent(dAppUrl);
        window.location.assign(`https://go.cb-w.com/dapp?cb_url=${encodedUrl}`);
        return;
      }
    }

    const isInstalled = wallet.checkInstalled();
    if (!isInstalled && wallet.installUrl) {
      setNotInstalledWallet(wallet);
      setErrorMsg(`${wallet.name} is not installed on this browser.`);
      return;
    }

    onConnect(wallet.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">Connect Wallet</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select your preferred wallet to log in to the Aries ecosystem.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="mb-4 bg-red-950/20 border-red-900/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {errorMsg}
              {notInstalledWallet?.installUrl && (
                <a
                  href={notInstalledWallet.installUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Install {notInstalledWallet.name} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          {walletsList.map((wallet) => {
            const isSelfConnecting = isConnecting && connectingWalletId === wallet.id;

            return (
              <Button
                key={wallet.id}
                variant="outline"
                size="lg"
                disabled={isConnecting}
                onClick={() => handleWalletSelect(wallet)}
                className={`justify-between h-16 px-4 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/60 hover:text-white hover:border-zinc-700 transition-all rounded-xl ${
                  isConnecting && !isSelfConnecting ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">{wallet.icon}</div>
                  <span className="text-[15px] font-semibold text-zinc-200">{wallet.name}</span>
                </div>

                {isSelfConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                )}
              </Button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center">
          <p className="text-xs text-zinc-500 font-medium">Secure, fee-less in-house connection portal.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
