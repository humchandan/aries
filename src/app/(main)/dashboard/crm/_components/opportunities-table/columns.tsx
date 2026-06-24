"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type StakerRow = {
  id: number;
  mobile: string;
  name: string;
  walletAddress: string;
  rank: string;
  level: number | "N/A";
  staked: number;
  teamVolume: number;
};

export const opportunitiesColumns: ColumnDef<StakerRow>[] = [
  {
    accessorKey: "mobile",
    header: "Mobile No",
    cell: ({ row }) => <div className="text-sm tracking-tight">{row.original.mobile || "N/A"}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.original.name || "Unknown"}</span>
        <span className="text-xs text-muted-foreground truncate w-32" title={row.original.walletAddress}>
          {row.original.walletAddress.substring(0, 6)}...{row.original.walletAddress.slice(-4)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <Badge variant="outline" className="rounded-full px-2.5">
        {row.original.rank || "Default"}
      </Badge>
    ),
  },
  {
    accessorKey: "level",
    header: "Level Depth",
    cell: ({ row }) => (
      <div className="text-sm font-medium">
        {row.original.level !== "N/A" ? `Level ${row.original.level}` : "Not in Tree"}
      </div>
    ),
  },
  {
    accessorKey: "staked",
    header: "Staked Amount",
    cell: ({ row }) => (
      <div className="font-medium tabular-nums text-emerald-400">
        {row.original.staked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARES
      </div>
    ),
  },
  {
    accessorKey: "teamVolume",
    header: "Team Business",
    cell: ({ row }) => (
      <div className="font-bold tabular-nums">
        {row.original.teamVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARES
      </div>
    ),
  },
];
