"use client";

import { useWeb3 } from "@/hooks/useWeb3";
import { AlertTriangle } from "lucide-react";

export function BanBanner() {
  const { userProfile } = useWeb3();

  if (!userProfile?.isBanned) return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-3 flex items-center justify-center text-sm font-medium sticky top-0 z-50 backdrop-blur-md">
      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
      <span>
        Your account has been restricted due to suspicious activity. Withdrawals, transfers, and bill payments are disabled.
      </span>
    </div>
  );
}
