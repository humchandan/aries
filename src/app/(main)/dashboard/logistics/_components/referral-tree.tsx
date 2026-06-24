"use client";

import * as React from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  Users,
  User,
  Loader2,
  Copy,
  Check,
  Search,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

interface ReferralNode {
  walletAddress: string;
  sponsorAddress: string;
  name: string;
  mobile: string;
  rank: string;
  level: number;
  uplineName: string;
  teamBusiness: number;
  joinedDate: string;
  children: ReferralNode[];
}

const LEVEL_COLORS = [
  { border: "border-emerald-700/50", bg: "bg-emerald-950/20", text: "text-emerald-400", dot: "bg-emerald-500", line: "border-emerald-800/40" },
  { border: "border-cyan-700/50", bg: "bg-cyan-950/20", text: "text-cyan-400", dot: "bg-cyan-500", line: "border-cyan-800/40" },
  { border: "border-violet-700/50", bg: "bg-violet-950/20", text: "text-violet-400", dot: "bg-violet-500", line: "border-violet-800/40" },
  { border: "border-amber-700/50", bg: "bg-amber-950/20", text: "text-amber-400", dot: "bg-amber-500", line: "border-amber-800/40" },
  { border: "border-rose-700/50", bg: "bg-rose-950/20", text: "text-rose-400", dot: "bg-rose-500", line: "border-rose-800/40" },
  { border: "border-sky-700/50", bg: "bg-sky-950/20", text: "text-sky-400", dot: "bg-sky-500", line: "border-sky-800/40" },
  { border: "border-pink-700/50", bg: "bg-pink-950/20", text: "text-pink-400", dot: "bg-pink-500", line: "border-pink-800/40" },
  { border: "border-teal-700/50", bg: "bg-teal-950/20", text: "text-teal-400", dot: "bg-teal-500", line: "border-teal-800/40" },
  { border: "border-orange-700/50", bg: "bg-orange-950/20", text: "text-orange-400", dot: "bg-orange-500", line: "border-orange-800/40" },
  { border: "border-indigo-700/50", bg: "bg-indigo-950/20", text: "text-indigo-400", dot: "bg-indigo-500", line: "border-indigo-800/40" },
];

function buildTree(flatReferrals: any[], rootAddress: string): ReferralNode[] {
  // Create a map from walletAddress -> node
  const nodeMap = new Map<string, ReferralNode>();

  flatReferrals.forEach((ref) => {
    nodeMap.set(ref.walletAddress.toLowerCase(), {
      ...ref,
      walletAddress: ref.walletAddress.toLowerCase(),
      sponsorAddress: ref.sponsorAddress?.toLowerCase() || "",
      children: [],
    });
  });

  const rootChildren: ReferralNode[] = [];
  const rootAddr = rootAddress.toLowerCase();

  nodeMap.forEach((node) => {
    if (node.sponsorAddress === rootAddr) {
      rootChildren.push(node);
    } else {
      const parent = nodeMap.get(node.sponsorAddress);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Sort children by joinedDate
  const sortChildren = (nodes: ReferralNode[]) => {
    nodes.sort((a, b) => new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime());
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(rootChildren);

  return rootChildren;
}

function countDescendants(node: ReferralNode): number {
  let count = node.children.length;
  node.children.forEach((child) => {
    count += countDescendants(child);
  });
  return count;
}

function TreeNode({
  node,
  depth,
  highlightAddress,
  searchTerm,
}: {
  node: ReferralNode;
  depth: number;
  highlightAddress: string;
  searchTerm: string;
}) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const [copiedAddr, setCopiedAddr] = React.useState(false);
  const hasChildren = node.children.length > 0;
  const colorIdx = Math.min(depth, LEVEL_COLORS.length - 1);
  const color = LEVEL_COLORS[colorIdx];
  const descendantCount = countDescendants(node);
  const isHighlighted = highlightAddress && node.walletAddress === highlightAddress.toLowerCase();
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Auto-expand path to highlighted node
  React.useEffect(() => {
    if (isHighlighted && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  // Search match
  const matchesSearch =
    searchTerm &&
    (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.walletAddress.includes(searchTerm.toLowerCase()));

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(node.walletAddress);
    setCopiedAddr(true);
    toast.success("Address copied!");
    setTimeout(() => setCopiedAddr(false), 1500);
  };

  const shortAddr = `${node.walletAddress.slice(0, 6)}…${node.walletAddress.slice(-4)}`;

  return (
    <div className="relative">
      {/* Vertical connector line from parent */}
      {depth > 0 && (
        <div
          className={`absolute -top-0 left-[15px] w-px h-3 ${LEVEL_COLORS[Math.min(depth - 1, LEVEL_COLORS.length - 1)].line} border-l border-dashed`}
        />
      )}

      <div
        ref={nodeRef}
        className={`
          group relative rounded-xl border transition-all duration-200 cursor-pointer
          ${color.border} ${color.bg}
          ${isHighlighted ? "ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/10" : ""}
          ${matchesSearch ? "ring-1 ring-sky-500/40" : ""}
          hover:brightness-110
        `}
        style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 80)}px` : 0 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Expand/collapse toggle */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            {hasChildren ? (
              expanded ? (
                <ChevronDown className={`w-4 h-4 ${color.text} transition-transform`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${color.text} transition-transform`} />
              )
            ) : (
              <div className={`w-2 h-2 rounded-full ${color.dot}`} />
            )}
          </div>

          {/* Avatar circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${color.border} bg-black/30 flex-shrink-0`}
          >
            <User className={`w-4 h-4 ${color.text}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{node.name}</span>
              <Badge
                className={`text-[9px] px-1.5 py-0 ${color.bg} ${color.text} border ${color.border}`}
              >
                L{node.level}
              </Badge>
              {node.rank && node.rank !== "Default" && (
                <Badge className="text-[9px] px-1.5 py-0 bg-zinc-800/60 text-zinc-400 border border-zinc-700/50">
                  {node.rank}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-500 font-mono">{shortAddr}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
                title="Copy wallet address"
              >
                {copiedAddr ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-500 hover:text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Right side stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Team Biz</div>
              <div className="text-xs font-bold font-mono text-zinc-300">
                {Number(node.teamBusiness).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Joined</div>
              <div className="text-xs text-zinc-400">
                {new Date(node.joinedDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}
              </div>
            </div>
            {hasChildren && (
              <div className="text-right">
                <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Team</div>
                <div className={`text-xs font-bold ${color.text}`}>
                  {node.children.length} <span className="text-zinc-600 font-normal">({descendantCount})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 relative">
          {/* Vertical guide line */}
          <div
            className={`absolute left-[15px] top-0 bottom-0 border-l border-dashed ${color.line}`}
            style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 80)}px` : 0 }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.walletAddress}
              node={child}
              depth={depth + 1}
              highlightAddress={highlightAddress}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReferralTree() {
  const { jwtToken, userAddress, userProfile, isAdmin } = useWeb3();
  const searchParams = useSearchParams();
  const highlightAddress = searchParams.get("highlight") || "";

  const [referrals, setReferrals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandAll, setExpandAll] = React.useState(false);

  React.useEffect(() => {
    if (!jwtToken) return;

    const fetchReferrals = async () => {
      try {
        const endpoint = isAdmin ? "/api/admin/referrals" : "/api/user/referrals";
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.referrals || []);
        }
      } catch (err) {
        console.error("Failed to fetch referrals for tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [jwtToken, isAdmin]);

  const tree = React.useMemo(() => {
    if (!userAddress || referrals.length === 0) return [];
    return buildTree(referrals, userAddress);
  }, [referrals, userAddress]);

  const totalReferrals = referrals.length;
  const directReferrals = referrals.filter((r) => r.level === 1).length;
  const maxLevel = referrals.reduce((max, r) => Math.max(max, r.level), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-zinc-400" />
            <CardTitle className="text-base font-semibold">Downline Family Tree</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Your referral network visualized as a hierarchical tree up to 10 levels deep.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No referrals yet.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Share your referral link to start building your downline tree.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-zinc-400" />
              <CardTitle className="text-base font-semibold">Downline Family Tree</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Your referral network visualized as a hierarchical tree up to 10 levels deep.
            </CardDescription>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or wallet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-zinc-950/60 border border-zinc-800/60 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 w-64"
            />
          </div>
        </div>

        {/* Summary stats bar */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-800/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Network</span>
            <span className="text-xs font-bold text-white ml-1">{totalReferrals}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Direct</span>
            <span className="text-xs font-bold text-white ml-1">{directReferrals}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Depth</span>
            <span className="text-xs font-bold text-white ml-1">{maxLevel} levels</span>
          </div>

          {/* Level legend */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[9px] text-zinc-600 mr-1">Levels:</span>
            {Array.from({ length: Math.min(maxLevel, 10) }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold border ${LEVEL_COLORS[i].border} ${LEVEL_COLORS[i].bg} ${LEVEL_COLORS[i].text}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-1 max-h-[700px] overflow-y-auto">
        {tree.map((rootChild) => (
          <TreeNode
            key={rootChild.walletAddress}
            node={rootChild}
            depth={0}
            highlightAddress={highlightAddress}
            searchTerm={searchTerm}
          />
        ))}
      </CardContent>
    </Card>
  );
}
