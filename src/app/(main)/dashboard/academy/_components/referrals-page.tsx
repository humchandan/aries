"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { useWeb3 } from "@/hooks/useWeb3";

import { Referrals } from "./referrals";

export function ReferralsPage() {
  const { jwtToken, isAdmin } = useWeb3();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlmTiers, setMlmTiers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalReferralIncome: 0,
    availableReferralIncome: 0,
    pendingReferralIncome: 0,
  });

  useEffect(() => {
    if (!jwtToken) return;

    const fetchData = async () => {
      try {
        const referralEndpoint = "/api/user/referrals";
        const [refRes, configRes] = await Promise.all([
          fetch(referralEndpoint, { headers: { Authorization: `Bearer ${jwtToken}` } }),
          fetch("/api/user/mlm/config", { headers: { Authorization: `Bearer ${jwtToken}` } }),
        ]);

        if (refRes.ok) {
          const data = await refRes.json();
          setReferrals(data.referrals || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          setMlmTiers(configData.tiers || []);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jwtToken]);

  if (!jwtToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500 mb-4" />
        <p className="text-zinc-400">Waiting for wallet connection…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500 mb-4" />
        <p className="text-zinc-400">Loading your referral tree...</p>
      </div>
    );
  }

  return <Referrals referrals={referrals} mlmTiers={mlmTiers} stats={stats} />;
}
