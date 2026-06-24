"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeb3 } from "@/hooks/useWeb3";

const businessHealthChartConfig = {
  sales: {
    label: "Monthly Sales",
    color: "var(--chart-2)",
  },
  outflow: {
    label: "Outflow of Coins",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const axisMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const tooltipMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

export function PipelineActivity() {
  const { jwtToken, isAdmin } = useWeb3();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinessHealth() {
      if (!jwtToken || !isAdmin) return;
      try {
        const res = await fetch("/api/admin/business-health", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setChartData(data.data);
        }
      } catch (err) {
        console.error("Failed to load business health", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessHealth();
  }, [jwtToken, isAdmin]);

  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
  const totalOutflow = chartData.reduce((sum, item) => sum + item.outflow, 0);
  const outflowRatio = totalSales > 0 ? Math.round((totalOutflow / totalSales) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-12">
        <CardHeader>
          <CardTitle>Business Health</CardTitle>
          <CardAction>
            <Select defaultValue="last-12-months">
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-quarter">Last quarter</SelectItem>
                  <SelectItem value="last-12-months">Last 12 months</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <ChartContainer config={businessHealthChartConfig} className="h-72 w-full lg:col-span-8">
                <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={24} barGap={4}>
                  <defs>
                    <pattern
                      id="crm-sales-pattern"
                      width="4"
                      height="4"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <rect width="6" height="6" fill="var(--color-sales)" fillOpacity="0.15" />
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke="var(--color-sales)"
                        strokeWidth="1.25"
                        strokeOpacity="0.40"
                      />
                    </pattern>
                    <pattern
                      id="crm-outflow-pattern"
                      width="4"
                      height="4"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(135)"
                    >
                      <rect width="6" height="6" fill="var(--color-outflow)" fillOpacity="0.15" />
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke="var(--color-outflow)"
                        strokeWidth="1.25"
                        strokeOpacity="0.40"
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="0" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => axisMonthFormatter.format(new Date(String(value)))}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        labelFormatter={(value) => tooltipMonthFormatter.format(new Date(String(value)))}
                      />
                    }
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="sales"
                    name="Monthly Sales"
                    fill="url(#crm-sales-pattern)"
                    radius={[4, 4, 0, 0]}
                    stroke="var(--color-sales)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                  />
                  <Bar
                    dataKey="outflow"
                    name="Outflow of Coins"
                    fill="url(#crm-outflow-pattern)"
                    radius={[4, 4, 0, 0]}
                    stroke="var(--color-outflow)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                  />
                </BarChart>
              </ChartContainer>

              <div className="flex flex-col gap-5 rounded-lg p-4 lg:col-span-4">
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-4xl tabular-nums leading-none">
                    {totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                    <span className="font-normal text-lg text-muted-foreground">ARES</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Total monthly sales over the last 12 months.</p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                    Total System Outflow
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="font-medium text-2xl tabular-nums leading-none">
                      {totalOutflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                      <span className="font-normal text-muted-foreground text-sm">ARES</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{outflowRatio}% of sales returned as outflow.</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-0.5">
                    <Progress
                      value={outflowRatio}
                      className="h-2.5 bg-chart-5/12 *:data-[slot='progress-indicator']:bg-chart-5"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-medium tabular-nums">
                        {totalOutflow.toLocaleString(undefined, { maximumFractionDigits: 0 })} outflow
                      </div>
                      <div className="text-muted-foreground tabular-nums">
                        {totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} sales
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
