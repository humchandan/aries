"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { RecentCustomerRow } from "./schema";

export const recentCustomersColumns: ColumnDef<RecentCustomerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all customers on this page"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.name}`}
        />
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const isL1 = row.original.level === 1;
      const formattedName = isL1 ? row.original.name : row.original.name.charAt(0) + "...";
      const customerDetail = isL1
        ? row.original.mobile
        : `${row.original.walletAddress.substring(0, 6)}...${row.original.walletAddress.substring(row.original.walletAddress.length - 4)}`;

      return (
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between gap-3">
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate font-medium text-sm leading-none">{formattedName}</span>
                <span className="truncate text-muted-foreground text-xs leading-none">
                  {customerDetail} {isL1 && <span className="text-[10px] text-primary/75">(L1 Direct)</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.walletAddress} ${row.name} ${row.mobile}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const isActive = row.original.status === "Active";
      return (
        <Badge
          variant="outline"
          className={
            isActive
              ? "border-green-600 text-green-600 bg-green-500/5 px-1.5"
              : "border-zinc-700 text-zinc-500 bg-transparent px-1.5"
          }
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "selfStake",
    header: "Self Stake",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.selfStake.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES
      </span>
    ),
  },
  {
    accessorKey: "teamBusiness",
    header: "Team Business",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.teamBusiness.toLocaleString(undefined, { minimumFractionDigits: 2 })} ARES
      </span>
    ),
  },
  {
    accessorKey: "joinedDate",
    header: "Joined Date",
    cell: ({ row }) => {
      const baseDate = parseISO(row.original.joinedDate);
      return (
        <div className="grid gap-0.5">
          <span className="text-sm">{format(baseDate, "do MMMM yyyy")}</span>
          <span className="text-muted-foreground text-xs">at {format(baseDate, "h:mm a")}</span>
        </div>
      );
    },
  },
];
