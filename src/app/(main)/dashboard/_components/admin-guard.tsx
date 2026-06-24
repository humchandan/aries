"use client";

import type * as React from "react";

import { Loader2, ShieldAlert } from "lucide-react";

import { useWeb3 } from "@/hooks/useWeb3";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useWeb3();

  // If we are still checking the admin status (or haven't connected yet and are waiting for hydration)
  // we might want to show a loading state, but for now we rely on the fact that if isAdmin is exactly false, we block.
  // If isAdmin is null, we can render a loading state or just wait.

  if (isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mb-4" />
        <p className="text-zinc-400">Verifying access...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          This area is restricted to system administrators. Please ensure you have connected with the authorized master
          wallet.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
