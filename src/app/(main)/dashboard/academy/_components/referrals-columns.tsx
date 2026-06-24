"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import { Check, Clock, MoreHorizontal, X } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";

import { statusMeta } from "./data";

function RoleCell({ role, team }: { role: string; team: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="whitespace-nowrap">{role}</span>
      <span className="text-muted-foreground text-xs">{team}</span>
    </div>
  );
}

const RANK_STYLES = [
  {
    color: "text-zinc-400",
    bgColor: "bg-zinc-800/50",
    borderColor: "border-zinc-700",
    progressColor: "bg-zinc-500",
    dotClass: "bg-zinc-400",
    badgeClass: "bg-zinc-800 text-white border-zinc-700",
  },
  {
    color: "text-amber-600",
    bgColor: "bg-amber-950/30",
    borderColor: "border-amber-800/50",
    progressColor: "bg-amber-600",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-600/10 text-amber-500 border-amber-600/50",
  },
  {
    color: "text-amber-500",
    bgColor: "bg-amber-950/40",
    borderColor: "border-amber-700/50",
    progressColor: "bg-amber-500",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/50",
  },
  {
    color: "text-slate-300",
    bgColor: "bg-slate-800/40",
    borderColor: "border-slate-600/50",
    progressColor: "bg-slate-400",
    dotClass: "bg-slate-300",
    badgeClass: "bg-slate-300/10 text-slate-300 border-slate-300/50",
  },
  {
    color: "text-slate-200",
    bgColor: "bg-slate-800/60",
    borderColor: "border-slate-500/50",
    progressColor: "bg-slate-300",
    dotClass: "bg-slate-200",
    badgeClass: "bg-slate-200/10 text-slate-200 border-slate-200/50",
  },
  {
    color: "text-yellow-400",
    bgColor: "bg-yellow-950/30",
    borderColor: "border-yellow-700/50",
    progressColor: "bg-yellow-500",
    dotClass: "bg-yellow-400",
    badgeClass: "bg-yellow-400/10 text-yellow-400 border-yellow-400/50",
  },
  {
    color: "text-yellow-300",
    bgColor: "bg-yellow-950/40",
    borderColor: "border-yellow-600/50",
    progressColor: "bg-yellow-400",
    dotClass: "bg-yellow-300",
    badgeClass: "bg-yellow-300/10 text-yellow-300 border-yellow-300/50",
  },
  {
    color: "text-cyan-400",
    bgColor: "bg-cyan-950/30",
    borderColor: "border-cyan-700/50",
    progressColor: "bg-cyan-500",
    dotClass: "bg-cyan-400",
    badgeClass: "bg-cyan-400/10 text-cyan-400 border-cyan-400/50",
  },
  {
    color: "text-cyan-300",
    bgColor: "bg-cyan-950/40",
    borderColor: "border-cyan-600/50",
    progressColor: "bg-cyan-400",
    dotClass: "bg-cyan-300",
    badgeClass: "bg-cyan-300/10 text-cyan-300 border-cyan-300/50",
  },
  {
    color: "text-violet-400",
    bgColor: "bg-violet-950/30",
    borderColor: "border-violet-700/50",
    progressColor: "bg-violet-500",
    dotClass: "bg-violet-400",
    badgeClass: "bg-violet-400/10 text-violet-400 border-violet-400/50",
  },
];

function StatusBadge({ status, mlmTiers }: { status: string; mlmTiers: any[] }) {
  // Try to find rank level based on mlmTiers
  let tierIdx = 0;
  if (mlmTiers && mlmTiers.length > 0) {
    const foundIdx = mlmTiers.findIndex((t) => t.name.toLowerCase() === status.toLowerCase());
    if (foundIdx !== -1) {
      tierIdx = foundIdx;
    }
  }

  const style = RANK_STYLES[Math.min(tierIdx, RANK_STYLES.length - 1)];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", style.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", style.dotClass)} />
      {status || "Default"}
    </Badge>
  );
}

function getAvatarTone(name: string) {
  const tones = [
    "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 after:border-amber-200 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300 dark:after:border-amber-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 after:border-orange-200 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300 dark:after:border-orange-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 after:border-rose-200 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300 dark:after:border-rose-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-pink-100 [&_[data-slot=avatar-fallback]]:text-pink-700 after:border-pink-200 dark:[&_[data-slot=avatar-fallback]]:bg-pink-500/15 dark:[&_[data-slot=avatar-fallback]]:text-pink-300 dark:after:border-pink-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 after:border-fuchsia-200 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300 dark:after:border-fuchsia-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-purple-100 [&_[data-slot=avatar-fallback]]:text-purple-700 after:border-purple-200 dark:[&_[data-slot=avatar-fallback]]:bg-purple-500/15 dark:[&_[data-slot=avatar-fallback]]:text-purple-300 dark:after:border-purple-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 after:border-violet-200 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300 dark:after:border-violet-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 after:border-indigo-200 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300 dark:after:border-indigo-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 after:border-sky-200 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300 dark:after:border-sky-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 after:border-emerald-200 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300 dark:after:border-emerald-500/20",
  ];

  return tones[name.length % tones.length];
}

function getLastActiveBadge(lastActive: number) {
  if (lastActive < 1) {
    return {
      className: "bg-green-600 text-green-950 [&>svg]:text-white",
      icon: Check,
    };
  }

  if (lastActive < 4 * 60) {
    return {
      className: "bg-amber-500 text-amber-950",
      icon: Clock,
    };
  }

  if (lastActive < 7 * 24 * 60) {
    return {
      className: "bg-destructive",
      icon: null,
    };
  }

  return {
    className: "bg-muted-foreground text-muted",
    icon: X,
  };
}

function AvatarCell({ lastActive, name }: { lastActive: number; name: string }) {
  const badge = getLastActiveBadge(lastActive);
  const BadgeIcon = badge.icon;

  return (
    <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      <AvatarBadge className={badge.className}>{BadgeIcon ? <BadgeIcon /> : null}</AvatarBadge>
    </Avatar>
  );
}

function WorkspaceCell({ workspaces }: { workspaces: string[] }) {
  const [firstWorkspace, ...remainingWorkspaces] = workspaces;
  const remainingCount = remainingWorkspaces.length;

  return (
    <AvatarGroup className="*:data-[slot=avatar]:ring-0">
      {firstWorkspace ? (
        <Avatar className="after:rounded-sm">
          <AvatarFallback className="rounded-sm ring-0">{getInitials(firstWorkspace)}</AvatarFallback>
        </Avatar>
      ) : null}
      {remainingCount > 0 ? (
        <AvatarGroupCount className="rounded-sm border ring-card">+{remainingCount}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}

export const referralsColumns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all referrals"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.walletAddress}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Referral",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarCell name={row.original.name} lastActive={0} />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-xs">{row.original.mobile}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "uplineName",
    header: "Immediate Upline",
    filterFn: "equalsString",
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.uplineName}</div>,
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => <div className="text-sm">Level {row.original.level}</div>,
  },
  {
    accessorKey: "teamBusiness",
    header: "Total Team Business",
    cell: ({ row }) => (
      <div className="text-sm font-semibold">
        {Number(row.original.teamBusiness).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        ARES
      </div>
    ),
  },
  {
    accessorKey: "rank",
    header: "Rank",
    filterFn: "equalsString",
    cell: ({ row, table }) => {
      const mlmTiers = (table.options.meta as any)?.mlmTiers || [];
      return <StatusBadge status={row.original.rank} mlmTiers={mlmTiers} />;
    },
  },
  {
    id: "joinedDate",
    accessorFn: (row) => new Date(row.joinedDate).getTime(),
    header: "Joined date",
    cell: ({ row }) => (
      <div className="text-foreground text-sm">{new Date(row.original.joinedDate).toLocaleDateString()}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const walletAddr = row.original.walletAddress;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Open actions for ${row.original.name}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/dashboard/logistics?highlight=${encodeURIComponent(walletAddr)}`;
                }}
              >
                View in Referral Tree
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(walletAddr).then(() => {
                    // Optional: could use toast here
                  });
                }}
              >
                Copy Wallet Address
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableHiding: false,
    enableSorting: false,
  },
];
