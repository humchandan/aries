"use client";

import * as React from "react";

import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useWeb3 } from "@/hooks/useWeb3";
import { formatCurrency } from "@/lib/utils";

type BalanceKey = "unclaimed" | "metamask" | "utility" | "remaining";

const chartConfig = {
  unclaimed: {
    color: "#3b82f6", // blue-500
    label: "Unclaimed Earnings",
  },
  metamask: {
    color: "#10b981", // emerald-500
    label: "Withdrawals to Metamask",
  },
  utility: {
    color: "#f59e0b", // amber-500
    label: "Withdrawals to Utility",
  },
  remaining: {
    color: "#8b5cf6", // violet-500
    label: "Remaining Amount Due",
  },
} satisfies ChartConfig;

export function BalanceDistributionCard() {
  const { userAddress, userProfile } = useWeb3();
  const [accruedRewards, setAccruedRewards] = React.useState(0);

  // Live Ticker Logic
  React.useEffect(() => {
    if (!userAddress || !userProfile) return;

    const selfInvestment = parseFloat(userProfile.selfInvestment) || 0;
    const baseYield = parseFloat(userProfile.yieldBalance) || 0;
    const lastAccruedStr = userProfile.lastYieldAccruedAt;

    if (selfInvestment <= 0) {
      setAccruedRewards(baseYield);
      return;
    }

    const lastAccruedTime = lastAccruedStr ? new Date(lastAccruedStr).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastAccruedTime) / 1000));
    const ratePerSec = (selfInvestment * 0.085) / 2592000.0;

    const totalClaimed = parseFloat(userProfile.totalClaimed) || 0;
    const maxLimit = selfInvestment * 2.5;

    let initialAccrued = baseYield + elapsedSeconds * ratePerSec;
    if (totalClaimed + initialAccrued > maxLimit) {
      initialAccrued = maxLimit - totalClaimed;
    }

    setAccruedRewards(initialAccrued);

    const interval = setInterval(() => {
      setAccruedRewards((prev) => {
        let nextVal = prev + ratePerSec;
        if (totalClaimed + nextVal > maxLimit) {
          nextVal = Math.max(0, maxLimit - totalClaimed);
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userAddress, userProfile]);

  const selfInvestment = userProfile?.selfInvestment ? parseFloat(userProfile.selfInvestment) : 0;
  const lifetimeEarnings = selfInvestment * 2.5;
  const totalClaimed = userProfile?.totalClaimed ? parseFloat(userProfile.totalClaimed) : 0;

  // Withdrawals breakdown (handle safely if not populated yet)
  const metamaskWithdrawals = userProfile?.metamaskWithdrawals ? parseFloat(userProfile.metamaskWithdrawals) : 0;
  const utilityWithdrawals = userProfile?.utilityWithdrawals ? parseFloat(userProfile.utilityWithdrawals) : 0;

  // Since claims might be older data where destination wasn't tracked properly,
  // ensure metamask + utility doesn't exceed totalClaimed, or fill gaps.
  const untrackedWithdrawals = Math.max(0, totalClaimed - (metamaskWithdrawals + utilityWithdrawals));
  const effectiveUtilityWithdrawals = utilityWithdrawals + untrackedWithdrawals;

  const remainingAmountDue = Math.max(0, lifetimeEarnings - totalClaimed - accruedRewards);

  const balanceData = [
    {
      account: "Withdrawals to Metamask",
      amount: metamaskWithdrawals,
      key: "metamask" as BalanceKey,
      fill: chartConfig.metamask.color,
    },
    {
      account: "Withdrawals to Utility",
      amount: effectiveUtilityWithdrawals,
      key: "utility" as BalanceKey,
      fill: chartConfig.utility.color,
    },
    {
      account: "Unclaimed Earnings",
      amount: accruedRewards,
      key: "unclaimed" as BalanceKey,
      fill: chartConfig.unclaimed.color,
    },
    {
      account: "Remaining Amount Due",
      amount: remainingAmountDue,
      key: "remaining" as BalanceKey,
      fill: chartConfig.remaining.color,
    },
  ];

  // Map to the specific display cards the user requested below the chart
  const displayCards = [
    { label: "Lifetime Earnings", amount: lifetimeEarnings, color: "#ffffff" },
    { label: "Withdrawals to Metamask", amount: metamaskWithdrawals, color: chartConfig.metamask.color },
    { label: "Withdrawals to Utility", amount: effectiveUtilityWithdrawals, color: chartConfig.utility.color },
    { label: "Remaining Amount Due", amount: remainingAmountDue, color: chartConfig.remaining.color },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Withdrawals History</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel className="w-52" nameKey="account" />}
            />
            <Pie
              cornerRadius={4}
              data={balanceData}
              dataKey="amount"
              innerRadius={65}
              nameKey="account"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={2}
              stroke="#18181b" // subtle border between slices
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan
                        className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 12}
                      >
                        Live Yield
                      </tspan>
                      <tspan
                        className="fill-foreground font-medium text-lg tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 10}
                      >
                        {accruedRewards.toLocaleString(undefined, {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        })}
                      </tspan>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) + 26}>
                        ARES
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {displayCards.map((item, i) => {
            const percentage = lifetimeEarnings > 0 ? ((item.amount / lifetimeEarnings) * 100).toFixed(1) : "0.0";
            return (
              <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={i}>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2 mb-1">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="truncate text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                      {item.label}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-white">
                    {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARES
                  </p>
                </div>
                {item.label !== "Lifetime Earnings" && (
                  <div className="font-mono text-xs tabular-nums text-zinc-500">{percentage}%</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
