"use client";

import { useEffect, useState } from "react";

import { ethers } from "ethers";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";

export function TotalStakedCard() {
  const { userProfile } = useWeb3();
  const totalStaked = userProfile
    ? parseFloat(userProfile.selfInvestment || "0").toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
  return (
    <Card className="gap-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 border-0">
      <CardHeader>
        <CardTitle className="font-normal text-zinc-400">Total Staked Amount</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-3xl leading-none tracking-tight font-mono">
            {totalStaked} <span className="text-sm text-zinc-500">ARES</span>
          </div>
          <p className="text-muted-foreground text-xs">Total lifetime investments</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletBalanceCard() {
  const { userAddress, provider } = useWeb3();
  const [walletBalance, setWalletBalance] = useState<string>("0.00");

  useEffect(() => {
    async function fetchBalance() {
      if (userAddress && provider) {
        try {
          const balanceWei = await provider.getBalance(userAddress);
          const balanceEth = ethers.formatEther(balanceWei);
          setWalletBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
          console.error("Failed to fetch wallet balance:", error);
        }
      }
    }
    fetchBalance();
  }, [userAddress, provider]);

  return (
    <Card className="gap-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 border-0">
      <CardHeader>
        <CardTitle className="font-normal text-zinc-400">Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-3xl leading-none tracking-tight font-mono">
            {walletBalance} <span className="text-sm text-zinc-500">ARES</span>
          </div>
          <p className="text-muted-foreground text-xs">Live on-chain balance</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamBusinessCard() {
  const { userProfile } = useWeb3();
  const teamVolume = userProfile
    ? parseFloat(userProfile.teamVolume || "0").toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  return (
    <Card className="gap-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 border-0">
      <CardHeader>
        <CardTitle className="font-normal text-zinc-400">Team Business Volume</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-3xl leading-none tracking-tight font-mono">
            {teamVolume} <span className="text-sm text-zinc-500">ARES</span>
          </div>
          <p className="text-muted-foreground text-xs">Total downline volume</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MonthlyGrowthCard() {
  return (
    <Card className="gap-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 border-0">
      <CardHeader>
        <CardTitle className="font-normal text-zinc-400">Monthly Growth</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-3xl leading-none tracking-tight font-mono">+12.5%</div>
          <p className="text-muted-foreground text-xs">Business compared to last calendar month</p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-500">+12.5%</Badge>
      </CardContent>
    </Card>
  );
}
