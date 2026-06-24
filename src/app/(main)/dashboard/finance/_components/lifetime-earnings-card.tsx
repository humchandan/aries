"use client";

import * as React from "react";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";
import { formatCurrency } from "@/lib/utils";

export function LifetimeEarningsCard() {
  const { userAddress, userProfile } = useWeb3();
  const [accruedRewards, setAccruedRewards] = React.useState(0);

  // Re-use live ticker to get exact remaining cap matching the pie chart
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
  const maxLimit = selfInvestment * 2.5;
  const totalClaimed = userProfile?.totalClaimed ? parseFloat(userProfile.totalClaimed) : 0;
  const remainingCap = Math.max(0, maxLimit - totalClaimed - accruedRewards);

  const data = [
    {
      name: "Active Purchase",
      value: selfInvestment,
      fill: "#3b82f6", // blue-500
    },
    {
      name: "Maximum Payment 2.5x",
      value: maxLimit,
      fill: "#10b981", // emerald-500
    },
    {
      name: "Amount Withdrawn",
      value: totalClaimed,
      fill: "#f59e0b", // amber-500
    },
    {
      name: "Remaining Cap",
      value: remainingCap,
      fill: "#8b5cf6", // violet-500
    },
  ];

  const formatTooltipCurrency = (value: number) =>
    `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARES`;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-normal">Lifetime earnings</CardTitle>
        <CardDescription>Track your active plan limits and payout thresholds.</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pb-6">
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
              />
              <Tooltip
                cursor={{ fill: "#27272a", opacity: 0.4 }}
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: any) => [formatTooltipCurrency(Number(value)), "Amount"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Breakdown Table underneath the graph */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-800/50"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-zinc-400 font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-white font-mono">
                {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
