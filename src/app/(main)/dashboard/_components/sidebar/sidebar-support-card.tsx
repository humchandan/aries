"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { siX } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarSupportCard() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "intermittent">("connected");

  useEffect(() => {
    const handleOnline = () => setStatus("connected");
    const handleOffline = () => setStatus("disconnected");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setStatus("disconnected");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatusDot = () => {
    switch (status) {
      case "connected":
        return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      case "intermittent":
        return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]";
      case "disconnected":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Node Active & Connected";
      case "intermittent":
        return "Intermittent Connection";
      case "disconnected":
        return "Node Disconnected";
    }
  };

  return (
    <Card
      size="sm"
      className="overflow-hidden shadow-none group-data-[collapsible=icon]:hidden bg-zinc-950/50 border-zinc-800/50"
    >
      <CardHeader className="min-w-0 px-4 py-3 flex flex-row items-center gap-3 space-y-0">
        <div className="relative flex h-3 w-3 items-center justify-center">
          {status === "connected" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${getStatusDot()}`} />
        </div>
        <div className="flex flex-col">
          <CardTitle className="truncate text-sm font-semibold tracking-tight text-zinc-100">Network Status</CardTitle>
          <CardDescription className="text-xs text-zinc-400 font-medium">{getStatusText()}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
