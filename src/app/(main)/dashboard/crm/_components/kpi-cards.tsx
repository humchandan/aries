import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export async function KpiCards() {
  const ignoredWallets = ["0xd01c1bfc96e22a9470c186e69e0a97e18eff23e6", "0x6f8f3ccd90d63d24ed54270c03803cf12dbb6a32"];

  // 1. Total Staking Done
  const totalStakingQuery = await prisma.stakingPlan.aggregate({
    _sum: { amount: true },
    where: { userAddress: { notIn: ignoredWallets } },
  });
  const totalStaking = Number(totalStakingQuery._sum.amount || 0);

  // 2. Withdrawals made on Metamask
  const metamaskQuery = await prisma.claimHistory.aggregate({
    _sum: { grossAmount: true },
    where: {
      destination: { in: ["METAMASK_50_50", "metamask", "METAMASK"] },
      userAddress: { notIn: ignoredWallets },
    },
  });
  const metamaskWithdrawals = Number(metamaskQuery._sum.grossAmount || 0);

  // 3. Withdrawals to Utility Portal Wallet
  const utilityQuery = await prisma.claimHistory.aggregate({
    _sum: { grossAmount: true },
    where: {
      destination: { in: ["UTILITY", "utility"] },
      userAddress: { notIn: ignoredWallets },
    },
  });
  const utilityWithdrawals = Number(utilityQuery._sum.grossAmount || 0);

  // 4. Lead-to-Deal Rate (Total % of Active users vs Total Signed Up Users)
  const totalUsers = await prisma.user.count({
    where: { walletAddress: { notIn: ignoredWallets } },
  });
  const activeUsersData = await prisma.stakingPlan.findMany({
    where: {
      userAddress: { notIn: ignoredWallets },
    },
    select: { userAddress: true },
    distinct: ["userAddress"],
  });
  const activeUsers = activeUsersData.length;
  const activePercent = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0.0";

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-3xl tracking-tight">System KPI Overview</h2>
        <p className="text-muted-foreground text-sm">
          Keep tabs on total network volume, claim history, and user activation rates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Staking */}
        <Card>
          <CardHeader>
            <CardDescription>Total Staking Volume</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{totalStaking.toLocaleString()} ARES</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">all-time deposits</span>
            </p>
          </CardContent>
        </Card>

        {/* Metamask Withdrawals */}
        <Card>
          <CardHeader>
            <CardDescription>Metamask Withdrawals</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{metamaskWithdrawals.toLocaleString()} ARES</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">all-time 50/50 splits</span>
            </p>
          </CardContent>
        </Card>

        {/* Utility Portal Withdrawals */}
        <Card>
          <CardHeader>
            <CardDescription>Utility Portal Claims</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{utilityWithdrawals.toLocaleString()} ARES</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">all-time internal transfers</span>
            </p>
          </CardContent>
        </Card>

        {/* User Activation Rate */}
        <Card>
          <CardHeader>
            <CardDescription>User Activation Rate</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{activePercent}%</span>
            </div>
            <p className="text-sm">
              <span className="font-medium text-foreground">{activeUsers} active</span>{" "}
              <span className="text-muted-foreground">/ {totalUsers} total users</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
