"use client";

import React from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, ArrowUpRight } from "lucide-react";

export function MappedHistory() {
  const { userProfile } = useWeb3();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-zinc-400" />
          <CardTitle>Staking History</CardTitle>
        </div>
        <CardDescription>
          Track all your active validation plan purchases.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!userProfile?.stakingPlans || userProfile.stakingPlans.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-zinc-800 rounded-xl">
            No plans purchased yet.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "300px" }}>
            {userProfile.stakingPlans.map((plan: any, index: number) => {
              const abbrHash = `${plan.txHash.substring(0, 6)}...${plan.txHash.substring(
                plan.txHash.length - 4
              )}`;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {Number(plan.amount).toLocaleString()} ARES
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-0.5">
                      {new Date(plan.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <a
                    href={`http://localhost:9081/tx/${plan.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-blue-400 transition-colors bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg"
                  >
                    {abbrHash} <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
