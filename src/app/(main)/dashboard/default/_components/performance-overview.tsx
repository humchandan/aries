"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useWeb3 } from "@/hooks/useWeb3";

interface ActivityPoint {
  date: string;
  newRegistrations: number;
  activeStakers: number;
  teamStakingVolume: number;
}

const chartConfig = {
  teamStakingVolume: {
    label: "Team Staking Volume (ARES)",
    color: "var(--chart-1)",
  },
  activeStakers: {
    label: "Active Downline Stakers",
    color: "var(--chart-2)",
  },
  newRegistrations: {
    label: "New Registrations",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function PerformanceOverview() {
  const { jwtToken, isConnected } = useWeb3();
  const [chartData, setChartData] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchActivity() {
      if (!jwtToken) return;
      try {
        setLoading(true);
        const res = await fetch("/api/user/team-activity", {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setChartData(json.chartData);
        }
      } catch (err) {
        console.error("Error fetching performance activity:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isConnected && jwtToken) {
      fetchActivity();
    }
  }, [isConnected, jwtToken]);

  if (loading) {
    return (
      <Card className="@container/card">
        <CardContent className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Team & Network Activity</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Daily network growth and staking volume for the last 30 days</span>
          <span className="@[540px]/card:hidden">Last 30 days team activity</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
          <ComposedChart data={chartData} margin={{ top: 0 }}>
            <defs>
              <linearGradient id="fillTeamVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-teamStakingVolume)" stopOpacity={0.36} />
                <stop offset="95%" stopColor="var(--color-teamStakingVolume)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} strokeOpacity={0.5} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) =>
                parseISO(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-64"
                  indicator="line"
                  labelFormatter={(value) => format(parseISO(value), "d MMMM yyyy")}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />

            {/* Area: Cumulative Staking Volume */}
            <Area
              dataKey="teamStakingVolume"
              type="monotone"
              fill="url(#fillTeamVolume)"
              stroke="var(--color-teamStakingVolume)"
              strokeWidth={1.25}
              dot={false}
              fillOpacity={1}
            />
            
            {/* Line 1: Active downline stakers count */}
            <Line
              dataKey="activeStakers"
              type="monotone"
              stroke="var(--color-activeStakers)"
              strokeWidth={1.4}
              dot={false}
            />

            {/* Line 2: New registrations count on that day */}
            <Line
              dataKey="newRegistrations"
              type="monotone"
              stroke="var(--color-newRegistrations)"
              strokeWidth={1.2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
