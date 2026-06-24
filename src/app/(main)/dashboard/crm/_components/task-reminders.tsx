import { AlertTriangle, ArrowUpRight, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export async function TaskReminders() {
  const ignoredWallets = ["0xd01c1bfc96e22a9470c186e69e0a97e18eff23e6", "0x6f8f3ccd90d63d24ed54270c03803cf12dbb6a32"];

  // 1. Total Staked
  const totalStakingQuery = await prisma.stakingPlan.aggregate({
    _sum: { amount: true },
    where: { userAddress: { notIn: ignoredWallets } },
  });
  const totalStaked = Number(totalStakingQuery._sum.amount || 0);
  const maxLiability = totalStaked * 2.5;

  // 2. Combined Withdrawals (Metamask + Utility)
  const claimsQuery = await prisma.claimHistory.aggregate({
    _sum: { grossAmount: true },
    where: { userAddress: { notIn: ignoredWallets } },
  });
  const totalWithdrawals = Number(claimsQuery._sum.grossAmount || 0);

  // 3. User requested calculation: Total Withdrawals - (Total Staked * 2.5)
  const difference = totalWithdrawals - maxLiability;
  const isHealthy = difference <= 0;

  // Calculate progress percentage (Claimed vs Liability)
  const liabilityProgress = maxLiability > 0 ? Math.min(100, (totalWithdrawals / maxLiability) * 100) : 0;

  // 42 bars for visual goal
  const barCount = 42;
  const activeBars = Math.round((liabilityProgress / 100) * barCount);
  const goalBars = Array.from({ length: barCount }, (_, index) => ({
    id: `liability-goal-${index + 1}`,
    active: index < activeBars,
  }));

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-8">
        <CardHeader>
          <CardTitle>System Payout Liability</CardTitle>
          <CardDescription>
            Real-time tracking of maximum network liability against combined withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                Maximum Liability (Staked × 2.5)
              </span>
              <span className="text-4xl font-black text-foreground tracking-tight">
                {maxLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-mono text-muted-foreground mt-1">ARES Token</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                Combined Withdrawals (Claimed)
              </span>
              <span className="text-4xl font-black text-foreground tracking-tight">
                {totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-mono text-muted-foreground mt-1">ARES Token</span>
            </div>
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isHealthy ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
                )}
              >
                {isHealthy ? <ShieldCheck className="size-6" /> : <AlertTriangle className="size-6" />}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Net Liability Difference</div>
                <div className="text-xs text-muted-foreground">
                  Formula: Combined Withdrawals - (Total Staked × 2.5)
                </div>
              </div>
            </div>
            <div
              className={cn(
                "text-2xl font-black font-mono tracking-tighter",
                isHealthy ? "text-emerald-500" : "text-red-500",
              )}
            >
              {difference > 0 ? "+" : ""}
              {difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-4">
        <CardHeader>
          <CardTitle>Global Limit Progress</CardTitle>
          <CardDescription>Total Claims vs Maximum 2.5x Limit</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 mt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {liabilityProgress.toFixed(1)}%{" "}
              <span className="font-normal text-base text-muted-foreground">claimed</span>
            </div>
          </div>
          <div className="flex h-12 w-full items-end gap-1 mt-6">
            {goalBars.map((bar) => (
              <div key={bar.id} className="flex flex-1 justify-center">
                <div
                  className={cn("h-12 w-2 rounded-full", bar.active ? "bg-emerald-500" : "bg-muted-foreground/20")}
                />
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm mt-6 leading-relaxed">
            {liabilityProgress.toFixed(1)}% of the absolute maximum system payout liability has been distributed to user
            wallets so far.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
