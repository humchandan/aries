"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingDown, TrendingUp, UserPlus, Users, Waves, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";

interface MetricsData {
  totalTeamBusiness: number;
  businessThisMonth: number;
  businessLastMonth: number;
  totalAccountsDownline: number;
  activeAccountsDownline: number;
  momGrowthRate: number;
  compoundingRatio: number;
  selfInvestment: number;
  level1Business: number;
  level2To10Business: number;
}

export function MetricCards() {
  const { jwtToken, isConnected } = useWeb3();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMetrics() {
      if (!jwtToken) return;
      try {
        setLoading(true);
        const res = await fetch("/api/user/dashboard-metrics", {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setData(json.stats);
        }
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isConnected && jwtToken) {
      fetchMetrics();
    }
  }, [isConnected, jwtToken]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate percentage change for Month vs Month business
  const monthDiff = data.businessThisMonth - data.businessLastMonth;
  const monthPct =
    data.businessLastMonth > 0
      ? (monthDiff / data.businessLastMonth) * 100
      : data.businessThisMonth > 0
      ? 100
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      
      {/* CARD 1: Total Team Business till date of the logged in User */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Team Business</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {data.totalTeamBusiness.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ARES
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Cumulative volume till date</p>
        </CardContent>
      </Card>

      {/* CARD 2: TOTAL business last month vs total business this month */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <UserPlus className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Month Business</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {data.businessThisMonth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}{" "}
              ARES
            </div>
            <Badge variant={monthPct >= 0 ? "default" : "destructive"}>
              {monthPct >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {monthPct >= 0 ? "+" : ""}
              {monthPct.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Last Month: {data.businessLastMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ARES
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: Active Accounts (under 10 levels downline) + Active among them */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Active Accounts</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {data.totalAccountsDownline.toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Active Accounts: {data.activeAccountsDownline.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: Growth Rate (Option 2 MoM Growth & Option 3 Compounding Ratio) */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Waves className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Growth & Compounding</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {data.momGrowthRate >= 0 ? "+" : ""}
              {data.momGrowthRate.toFixed(1)}%
            </div>
            <Badge variant={data.momGrowthRate >= 0 ? "default" : "destructive"}>
              {data.momGrowthRate >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              MoM Growth
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Organic Team Ratio: {data.compoundingRatio.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
