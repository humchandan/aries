"use client";

import * as React from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Plane, Trophy, Users, Star, Crown, Shield, Award, Gem, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Icon mapping by rank name keywords
const RANK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  default: Star,
  starter: Star,
  bronze: Shield,
  silver: Award,
  gold: Trophy,
  diamond: Gem,
  crown: Crown,
  leader: Crown,
};

const RANK_STYLES = [
  { color: "text-zinc-400", bgColor: "bg-zinc-800/50", borderColor: "border-zinc-700", progressColor: "bg-zinc-500" },
  { color: "text-amber-600", bgColor: "bg-amber-950/30", borderColor: "border-amber-800/50", progressColor: "bg-amber-600" },
  { color: "text-amber-500", bgColor: "bg-amber-950/40", borderColor: "border-amber-700/50", progressColor: "bg-amber-500" },
  { color: "text-slate-300", bgColor: "bg-slate-800/40", borderColor: "border-slate-600/50", progressColor: "bg-slate-400" },
  { color: "text-slate-200", bgColor: "bg-slate-800/60", borderColor: "border-slate-500/50", progressColor: "bg-slate-300" },
  { color: "text-yellow-400", bgColor: "bg-yellow-950/30", borderColor: "border-yellow-700/50", progressColor: "bg-yellow-500" },
  { color: "text-yellow-300", bgColor: "bg-yellow-950/40", borderColor: "border-yellow-600/50", progressColor: "bg-yellow-400" },
  { color: "text-cyan-400", bgColor: "bg-cyan-950/30", borderColor: "border-cyan-700/50", progressColor: "bg-cyan-500" },
  { color: "text-cyan-300", bgColor: "bg-cyan-950/40", borderColor: "border-cyan-600/50", progressColor: "bg-cyan-400" },
  { color: "text-violet-400", bgColor: "bg-violet-950/30", borderColor: "border-violet-700/50", progressColor: "bg-violet-500" },
];

function getIconForRank(rankName: string) {
  const lower = rankName.toLowerCase();
  for (const [key, Icon] of Object.entries(RANK_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Star;
}

function getProgressToNext(
  selfInvestment: number,
  directs: number,
  teamVolume: number,
  nextTier: any
): number {
  if (!nextTier) return 100;
  const stakeProgress = nextTier.minSelfInvestment > 0 ? Math.min(selfInvestment / nextTier.minSelfInvestment, 1) : 1;
  const directsProgress = nextTier.minDirects > 0 ? Math.min(directs / nextTier.minDirects, 1) : 1;
  const teamProgress = nextTier.minTeamVolume > 0 ? Math.min(teamVolume / nextTier.minTeamVolume, 1) : 1;
  return Math.floor(((stakeProgress + directsProgress + teamProgress) / 3) * 100);
}

export function CurrentRank() {
  const { userProfile, userAddress, jwtToken } = useWeb3();
  const [copied, setCopied] = React.useState(false);
  const [mlmTiers, setMlmTiers] = React.useState<any[]>([]);
  const [mlmLevels, setMlmLevels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const selfInvestment = parseFloat(userProfile?.selfInvestment || "0");
  const directs = userProfile?.directs || 0;
  const teamVolume = parseFloat(userProfile?.teamVolume || "0");
  const userRankName = userProfile?.rank || "Default";

  React.useEffect(() => {
    async function fetchConfig() {
      if (!jwtToken) return;
      try {
        setLoading(true);
        const res = await fetch("/api/user/mlm/config", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMlmTiers(data.tiers || []);
          setMlmLevels(data.levels || []);
        }
      } catch (e) {
        console.error("Failed to load MLM config:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [jwtToken]);

  // Find the current tier index by matching rank name
  const currentTierIdx = mlmTiers.findIndex(
    (t) => t.name.toLowerCase() === userRankName.toLowerCase()
  );
  const resolvedIdx = currentTierIdx >= 0 ? currentTierIdx : 0;
  const currentTier = mlmTiers[resolvedIdx];
  const nextTier = mlmTiers[resolvedIdx + 1] || null;

  // Find level bonus for current tier (levels are matched by requiredRank)
  const currentLevel = mlmLevels.find(
    (l) => l.requiredRank?.toLowerCase() === userRankName.toLowerCase()
  ) || mlmLevels[resolvedIdx];

  const progressPct = getProgressToNext(selfInvestment, directs, teamVolume, nextTier);

  const style = RANK_STYLES[Math.min(resolvedIdx, RANK_STYLES.length - 1)];
  const CurrentIcon = getIconForRank(userRankName);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/v2/register?ref=${userAddress}`
      : `https://app.arieschain.org/auth/v2/register?ref=${userAddress}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">Current Rank</h1>
          <p className="text-muted-foreground text-sm">Your MLM level progression and referral tools</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Current Rank</h1>
        <p className="text-muted-foreground text-sm">Your MLM level progression and referral tools</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT: Rank hero + Progress + Referral */}
        <div className="flex flex-col gap-6 xl:col-span-1">

          {/* Current Rank Hero */}
          <Card className={`border ${style.borderColor} ${style.bgColor}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Rank</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${style.borderColor} bg-black/30`}>
                <CurrentIcon className={`w-10 h-10 ${style.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${style.color}`}>{userRankName}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Level {resolvedIdx + 1} of {mlmTiers.length}
                </div>
              </div>
              {currentLevel && (
                <Badge className={`${style.bgColor} ${style.color} border ${style.borderColor} text-sm px-4 py-1`}>
                  {Number(currentLevel.bonus).toFixed(1)}% Bonus Rate
                </Badge>
              )}
              {currentTier && (
                <div className="w-full grid grid-cols-3 gap-2 text-center text-xs mt-1">
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="font-bold text-zinc-200">{Number(currentTier.minSelfInvestment).toLocaleString()}</div>
                    <div className="text-zinc-600 text-[10px] uppercase">Min Stake</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="font-bold text-zinc-200">{currentTier.minDirects}</div>
                    <div className="text-zinc-600 text-[10px] uppercase">Directs</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="font-bold text-zinc-200">
                      {Number(currentTier.minTeamVolume) >= 1000000
                        ? `${(Number(currentTier.minTeamVolume) / 1000000).toFixed(1)}M`
                        : Number(currentTier.minTeamVolume) >= 1000
                        ? `${(Number(currentTier.minTeamVolume) / 1000).toFixed(0)}K`
                        : Number(currentTier.minTeamVolume)}
                    </div>
                    <div className="text-zinc-600 text-[10px] uppercase">Team Vol</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress to Next Rank */}
          {nextTier && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Progress to {nextTier.name}</CardTitle>
                <CardDescription className="text-xs">Level {resolvedIdx + 2} of {mlmTiers.length}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plane progress bar */}
                <div className="relative pt-4">
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${style.progressColor}`}
                      style={{ width: `${Math.min(progressPct, 97)}%` }}
                    />
                  </div>
                  <div
                    className="absolute top-0 transition-all duration-700"
                    style={{ left: `calc(${Math.min(progressPct, 90)}% - 10px)` }}
                  >
                    <Plane className={`w-5 h-5 ${style.color}`} fill="currentColor" />
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-500">{progressPct}% complete</div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Self Investment</span>
                    <span className={selfInvestment >= Number(nextTier.minSelfInvestment) ? "text-emerald-400" : "text-zinc-300"}>
                      {selfInvestment.toLocaleString()} / {Number(nextTier.minSelfInvestment).toLocaleString()} ARES
                      {selfInvestment >= Number(nextTier.minSelfInvestment) && <Check className="inline w-3 h-3 ml-1" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Direct Referrals</span>
                    <span className={directs >= nextTier.minDirects ? "text-emerald-400" : "text-zinc-300"}>
                      {directs} / {nextTier.minDirects}
                      {directs >= nextTier.minDirects && <Check className="inline w-3 h-3 ml-1" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Team Volume</span>
                    <span className={teamVolume >= Number(nextTier.minTeamVolume) ? "text-emerald-400" : "text-zinc-300"}>
                      {teamVolume.toLocaleString()} / {Number(nextTier.minTeamVolume).toLocaleString()} ARES
                      {teamVolume >= Number(nextTier.minTeamVolume) && <Check className="inline w-3 h-3 ml-1" />}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <CardTitle className="text-sm font-semibold">Your Referral Link</CardTitle>
              </div>
              <CardDescription className="text-xs">Share this link to earn direct referral bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 break-all text-xs font-mono text-zinc-400">
                {userAddress ? referralLink : "Connect wallet to get your referral link"}
              </div>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={handleCopyReferral}
                disabled={!userAddress}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Referral Link"}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Direct referrals</span>
                <span className="font-semibold text-white">{directs}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: All tiers grid */}
        <div className="xl:col-span-2">
          {mlmTiers.length === 0 ? (
            <Card className="p-8 text-center text-zinc-500">No rank configuration found in database.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mlmTiers.map((tier, idx) => {
                const isAchieved = resolvedIdx >= idx;
                const isCurrent = resolvedIdx === idx;
                const tierStyle = RANK_STYLES[Math.min(idx, RANK_STYLES.length - 1)];
                const TierIcon = getIconForRank(tier.name);
                // Find matching level bonus
                const matchingLevel = mlmLevels.find(
                  (l) => l.requiredRank?.toLowerCase() === tier.name.toLowerCase()
                ) || mlmLevels[idx];
                const bonus = matchingLevel ? Number(matchingLevel.bonus).toFixed(1) : "—";

                return (
                  <Card
                    key={tier.id}
                    className={`relative border transition-all duration-200 ${
                      isCurrent
                        ? `${tierStyle.borderColor} ${tierStyle.bgColor}`
                        : isAchieved
                        ? `${tierStyle.borderColor} ${tierStyle.bgColor} opacity-80`
                        : "border-zinc-800/50 bg-zinc-900/30 opacity-50"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 right-3">
                        <Badge className={`text-[10px] px-2 py-0.5 ${tierStyle.bgColor} ${tierStyle.color} border ${tierStyle.borderColor}`}>
                          Current
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${tierStyle.borderColor} bg-black/20`}>
                            <TierIcon className={`w-5 h-5 ${tierStyle.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-600 font-mono">Lvl {idx + 1}</span>
                              {isAchieved && <Check className="w-3 h-3 text-emerald-500" />}
                            </div>
                            <div className={`font-semibold text-sm ${isAchieved ? tierStyle.color : "text-zinc-500"}`}>
                              {tier.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold font-mono ${isAchieved ? tierStyle.color : "text-zinc-600"}`}>
                            {bonus}%
                          </div>
                          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Bonus</div>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="mt-3">
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isAchieved ? tierStyle.progressColor : "bg-zinc-700"}`}
                            style={{ width: isCurrent ? `${progressPct}%` : isAchieved ? "100%" : "0%" }}
                          />
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                        <div className="bg-black/20 rounded p-1.5">
                          <div className={`text-[10px] font-mono font-bold ${isAchieved ? "text-zinc-200" : "text-zinc-600"}`}>
                            {Number(tier.minSelfInvestment) >= 1000
                              ? `${(Number(tier.minSelfInvestment) / 1000).toFixed(0)}K`
                              : Number(tier.minSelfInvestment)}
                          </div>
                          <div className="text-[9px] text-zinc-600 uppercase">Stake</div>
                        </div>
                        <div className="bg-black/20 rounded p-1.5">
                          <div className={`text-[10px] font-mono font-bold ${isAchieved ? "text-zinc-200" : "text-zinc-600"}`}>
                            {tier.minDirects}
                          </div>
                          <div className="text-[9px] text-zinc-600 uppercase">Directs</div>
                        </div>
                        <div className="bg-black/20 rounded p-1.5">
                          <div className={`text-[10px] font-mono font-bold ${isAchieved ? "text-zinc-200" : "text-zinc-600"}`}>
                            {Number(tier.minTeamVolume) >= 1000000
                              ? `${(Number(tier.minTeamVolume) / 1000000).toFixed(1)}M`
                              : Number(tier.minTeamVolume) >= 1000
                              ? `${(Number(tier.minTeamVolume) / 1000).toFixed(0)}K`
                              : Number(tier.minTeamVolume)}
                          </div>
                          <div className="text-[9px] text-zinc-600 uppercase">Team Vol</div>
                        </div>
                      </div>

                      {/* Unlocked levels pills */}
                      <div className="mt-3">
                        <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5">
                          Downline Levels Unlocked
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvlNum) => {
                            const unlocked = isAchieved && lvlNum <= Number(tier.unlockedLevels);
                            const isMyLevel = isCurrent && lvlNum <= Number(tier.unlockedLevels);
                            const lvlBonus = mlmLevels.find((l) => l.level === lvlNum);
                            return (
                              <div
                                key={lvlNum}
                                title={unlocked && lvlBonus ? `Level ${lvlNum}: ${Number(lvlBonus.bonus).toFixed(2)}%` : `Level ${lvlNum}: Locked`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border transition-all ${
                                  isMyLevel
                                    ? `${tierStyle.bgColor} ${tierStyle.color} ${tierStyle.borderColor}`
                                    : unlocked
                                    ? "bg-zinc-700/50 text-zinc-300 border-zinc-600"
                                    : "bg-zinc-900/40 text-zinc-700 border-zinc-800/40"
                                }`}
                              >
                                {lvlNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Level Access Matrix ── */}
      {mlmLevels.length > 0 && mlmTiers.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Downline Level Access Matrix</CardTitle>
            <CardDescription className="text-xs">
              Shows which rank unlocks each downline commission level and the bonus % earned.
              Your active levels are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60">
                    <th className="px-4 py-3 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Level</th>
                    <th className="px-4 py-3 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Bonus %</th>
                    <th className="px-4 py-3 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Required Rank</th>
                    {mlmTiers.map((tier, idx) => {
                      const ts = RANK_STYLES[Math.min(idx, RANK_STYLES.length - 1)];
                      const isCurTier = resolvedIdx === idx;
                      return (
                        <th
                          key={tier.id}
                          className={`px-3 py-3 text-center font-semibold uppercase tracking-wider whitespace-nowrap ${
                            isCurTier ? ts.color : "text-zinc-600"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px]">{isCurTier ? "★ " : ""}{tier.name}</span>
                            <span className="text-[9px] font-normal text-zinc-600">{tier.unlockedLevels} lvls</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 text-left text-zinc-500 font-semibold uppercase tracking-wider">Your Access</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((lvlNum) => {
                    const lvl = mlmLevels.find((l) => l.level === lvlNum);
                    if (!lvl) return null;
                    // The tier that first unlocks this level
                    const requiredTier = mlmTiers.find(
                      (t) => t.name.toLowerCase() === lvl.requiredRank?.toLowerCase()
                    );
                    const requiredTierIdx = requiredTier ? mlmTiers.indexOf(requiredTier) : -1;
                    const userHasAccess =
                      currentTier && Number(currentTier.unlockedLevels) >= lvlNum;

                    return (
                      <tr
                        key={lvlNum}
                        className={`border-b border-zinc-800/40 transition-colors ${
                          userHasAccess
                            ? "bg-emerald-950/10 hover:bg-emerald-950/20"
                            : "hover:bg-zinc-900/30"
                        }`}
                      >
                        {/* Level */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold border ${
                                userHasAccess
                                  ? `${style.bgColor} ${style.color} ${style.borderColor}`
                                  : "bg-zinc-900 text-zinc-600 border-zinc-800"
                              }`}
                            >
                              {lvlNum}
                            </span>
                            {userHasAccess && (
                              <Check className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                        </td>

                        {/* Bonus */}
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-bold text-sm ${
                              userHasAccess ? "text-emerald-400" : "text-zinc-500"
                            }`}
                          >
                            {Number(lvl.bonus).toFixed(2)}%
                          </span>
                        </td>

                        {/* Required Rank */}
                        <td className="px-4 py-3">
                          {requiredTier ? (
                            <span
                              className={`font-semibold ${
                                RANK_STYLES[Math.min(requiredTierIdx, RANK_STYLES.length - 1)].color
                              }`}
                            >
                              {requiredTier.name}
                            </span>
                          ) : (
                            <span className="text-zinc-500">{lvl.requiredRank || "—"}</span>
                          )}
                        </td>

                        {/* Per-tier columns: is this level unlocked at this tier? */}
                        {mlmTiers.map((tier, idx) => {
                          const tierUnlocks = Number(tier.unlockedLevels) >= lvlNum;
                          const isUserTier = resolvedIdx === idx;
                          const ts = RANK_STYLES[Math.min(idx, RANK_STYLES.length - 1)];
                          return (
                            <td key={tier.id} className="px-3 py-3 text-center">
                              {tierUnlocks ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                                    isUserTier
                                      ? `${ts.bgColor} ${ts.color} border ${ts.borderColor}`
                                      : idx < resolvedIdx
                                      ? "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
                                      : "bg-zinc-900/40 text-zinc-600 border border-zinc-800/40"
                                  }`}
                                  title={`${tier.name} unlocks Level ${lvlNum}`}
                                >
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-block w-6 h-6 rounded-full bg-zinc-900/20 border border-zinc-800/20" />
                              )}
                            </td>
                          );
                        })}

                        {/* User access summary */}
                        <td className="px-4 py-3">
                          {userHasAccess ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-700 text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-zinc-600 border-zinc-700 text-[10px]">
                              Locked
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-zinc-800/50 bg-zinc-950/30">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold ${style.bgColor} ${style.color} border ${style.borderColor}`}>✓</span>
                Your current rank
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/50 text-zinc-400 border border-zinc-700 text-[9px] font-bold">✓</span>
                Lower rank (achieved)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span className="inline-block w-5 h-5 rounded-full bg-zinc-900/20 border border-zinc-800/20" />
                Not unlocked at this rank
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-700 text-[9px]">Active</Badge>
                You earn this level's commission
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
