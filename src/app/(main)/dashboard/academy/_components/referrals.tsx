"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Cog, Download, Grid, Plus, Rows3, Search, SlidersHorizontal, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { filters } from "./data";
import { referralsColumns } from "./referrals-columns";
import { ReferralsTable } from "./referrals-table";

export function Referrals({
  referrals,
  mlmTiers,
  stats,
}: {
  referrals: any[];
  mlmTiers: any[];
  stats?: {
    lifetimeTotal?: number;
    totalReferralIncome: number;
    availableReferralIncome: number;
    pendingReferralIncome: number;
  };
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinedDate", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
    team: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [processing, setProcessing] = React.useState<boolean>(false);

  const table = useReactTable({
    data: referrals,
    columns: referralsColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.email,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  const commissionStats = stats || {
    lifetimeTotal: 0,
    totalReferralIncome: 0,
    availableReferralIncome: 0,
    pendingReferralIncome: 0,
  };

  const displayLifetime = commissionStats.lifetimeTotal !== undefined ? commissionStats.lifetimeTotal : commissionStats.totalReferralIncome;

  return (
    <div className="space-y-6">
      {/* Commission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/40 border-zinc-800/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-zinc-500">Lifetime Total</CardDescription>
            <CardTitle className="text-2xl font-black text-white">
              {displayLifetime.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Total commissions generated from Levels 1 to 10 (Lifetime)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/40 border-zinc-800/80 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold tracking-wider text-green-500">Available for Withdrawal</CardDescription>
              <CardTitle className="text-2xl font-black text-green-400">
                {commissionStats.availableReferralIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500">Released once downline investors execute withdrawals.</p>
              {commissionStats.availableReferralIncome > 0 && (
                <p className="text-[11px] text-amber-500/90 font-medium mt-1">
                  Net payout: {(commissionStats.availableReferralIncome * 0.9).toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES (10% fee applied)
                </p>
              )}
            </CardContent>
          </div>
          {commissionStats.availableReferralIncome > 0 && (
            <div className="px-6 pb-6 pt-0 flex flex-col gap-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-9 text-xs"
                disabled={processing}
                onClick={async () => {
                  try {
                    setProcessing(true);
                    const jwt = localStorage.getItem("jwt_token");
                    if (!jwt) return;
                    const res = await fetch("/api/user/network/redeem", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ destination: "metamask" }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      alert(`Successfully redeemed ${json.amount} ARES directly to MetaMask!`);
                      window.location.reload();
                    } else {
                      alert(json.error || "Redemption failed.");
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Error processing network redeem transaction.");
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "⚡ Withdraw to MetaMask"
                )}
              </Button>
              <Button
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-9 text-xs border border-zinc-700/60"
                disabled={processing}
                onClick={async () => {
                  try {
                    setProcessing(true);
                    const jwt = localStorage.getItem("jwt_token");
                    if (!jwt) return;
                    const res = await fetch("/api/user/network/redeem", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ destination: "utility" }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      alert(`Successfully transferred ${json.amount} ARES directly to Utility Wallet!`);
                      window.location.reload();
                    } else {
                      alert(json.error || "Transfer failed.");
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Error processing utility transfer transaction.");
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "💼 Transfer to Utility Wallet"
                )}
              </Button>
            </div>
          )}
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-amber-500">Pending Release</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-400">
              {commissionStats.pendingReferralIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">Commissions locked until downline stakers make a withdrawal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Your Referrals</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          View your downline referral network up to 10 levels deep.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Search referrals..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <Button variant="outline" size="sm">
            <SlidersHorizontal /> Hide
          </Button>
          <Button variant="outline" size="sm">
            <Cog /> Customize
          </Button>
          <Button variant="outline" size="sm">
            <Download /> Export
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">{selectedCount} selected</div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" aria-label="List view">
                <Rows3 />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <Grid />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ReferralsTable table={table} />
      </CardContent>
    </Card>
  </div>
);
}
