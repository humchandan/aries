import { NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all users
    const allUsers = await prisma.user.findMany({
      select: {
        walletAddress: true,
        sponsorAddress: true,
        name: true,
        mobile: true,
        rank: true,
        createdAt: true,
      },
    });

    // 2. Fetch all staking plans and aggregate by user
    const stakingAggregations = await prisma.stakingPlan.groupBy({
      by: ["userAddress"],
      _sum: {
        amount: true,
      },
    });

    // Create maps for quick lookup
    const userMap = new Map<string, any>();
    const childrenMap = new Map<string, string[]>();
    const stakingMap = new Map<string, number>();

    allUsers.forEach((u) => {
      const addr = u.walletAddress.toLowerCase();
      userMap.set(addr, { ...u, walletAddress: addr, sponsorAddress: u.sponsorAddress.toLowerCase() });
      if (!childrenMap.has(addr)) {
        childrenMap.set(addr, []);
      }
    });

    allUsers.forEach((u) => {
      const sponsor = u.sponsorAddress.toLowerCase();
      if (childrenMap.has(sponsor)) {
        childrenMap.get(sponsor)!.push(u.walletAddress.toLowerCase());
      } else {
        childrenMap.set(sponsor, [u.walletAddress.toLowerCase()]);
      }
    });

    stakingAggregations.forEach((st) => {
      stakingMap.set(st.userAddress.toLowerCase(), Number(st._sum.amount || 0));
    });

    // 3. Helper to calculate total team business (downstream staking sum)
    const calculateTeamBusiness = (addr: string): number => {
      let total = 0;
      const stack = [addr];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);

        // Do not include their own personal investment in "Team Business" (L1-L10) if they are the starting node.
        // But do include it for descendants.
        if (current !== addr) {
          total += stakingMap.get(current) || 0;
        }

        const children = childrenMap.get(current) || [];
        for (const child of children) {
          stack.push(child);
        }
      }
      return total;
    };

    // 4. Calculate user's referral commission metrics (NetworkEarning)
    const userCommissionEntries = await prisma.networkEarning.findMany({
      where: { userAddress: walletAddress.toLowerCase() },
    });
    
    // Lifetime Total Generated Income (unclaimed + claimed)
    const totalReferralIncome = userCommissionEntries.reduce((acc, curr) => acc + Number(curr.amount), 0);
    // Available/Unclaimed income (isClaimed = false)
    const availableReferralIncome = userCommissionEntries.filter((e) => !e.isClaimed).reduce((acc, curr) => acc + Number(curr.amount), 0);
    // Redeemed/Withdrawn income (isClaimed = true)
    const withdrawnReferralIncome = userCommissionEntries.filter((e) => e.isClaimed).reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    // Pending release commissions (Commissions locked until downlines make a withdrawal)
    // To represent this dynamically: we can sum up matching level commission weights on active downline investments 
    // where no yield claims/withdrawals have been executed yet by the downline stakers.
    // For dummy testing scenarios, we calculate pending commissions dynamically based on unwithdrawn downline plans:
    let pendingReferralIncome = 0;
    
    // Find all downlines and check their total unwithdrawn staking yield to compute locked commission
    // Or we can mock pending based on totalReferralIncome * 0.4 fallback if no database model tracks unreleased queue
    const claimsMap = new Map<string, number>();
    const claimHistories = await prisma.claimHistory.findMany();
    claimHistories.forEach(c => {
      const addr = c.userAddress.toLowerCase();
      if (!claimsMap.has(addr)) claimsMap.set(addr, 0);
      claimsMap.set(addr, claimsMap.get(addr)! + Number(c.grossAmount));
    });

    // Simple matching calculation to show true pending commission where downline staker has staking plan but no withdrawals
    const levelsMap = new Map<number, number>([
      [1, 0.10], // 10%
      [2, 0.05], // 5%
      [3, 0.03], // 3%
      [4, 0.02], // 2%
      [5, 0.01], // 1%
    ]);

    // 5. Traverse up to 10 levels to find the referrals
    const referrals: any[] = [];
    const bfsVisited = new Set<string>();
    bfsVisited.add(walletAddress.toLowerCase());

    // BFS to get up to 10 levels
    const queue: { addr: string; level: number; uplineName: string }[] = [];

    const rootAddr = walletAddress.toLowerCase();
    const directChildren = childrenMap.get(rootAddr) || [];

    for (const childAddr of directChildren) {
      queue.push({ addr: childAddr, level: 1, uplineName: userMap.get(rootAddr)?.name || "You" });
    }

    while (queue.length > 0) {
      const { addr, level, uplineName } = queue.shift()!;

      if (level > 10) continue; // Only up to 10 levels
      if (bfsVisited.has(addr)) continue;
      bfsVisited.add(addr);

      const userNode = userMap.get(addr);
      if (userNode) {
        // Calculate team business
        const teamBusiness = calculateTeamBusiness(addr);
        const selfStaking = stakingMap.get(addr) || 0;
        const status = selfStaking > 0 ? "Active" : "Inactive";

        // Calculate potential unreleased pending commission if downline user has staked,
        // but has executed NO withdrawals/claims historically (so the commission remains locked).
        const downlineClaims = claimsMap.get(addr) || 0;
        if (selfStaking > 0 && downlineClaims === 0) {
          const levelMultiplier = levelsMap.get(level) || 0;
          pendingReferralIncome += selfStaking * levelMultiplier;
        }

        referrals.push({
          walletAddress: userNode.walletAddress,
          sponsorAddress: userNode.sponsorAddress,
          name: userNode.name,
          mobile: userNode.mobile,
          rank: userNode.rank,
          level,
          uplineName,
          selfStake: selfStaking,
          teamBusiness,
          status,
          joinedDate: userNode.createdAt,
        });

        // Add next level
        if (level < 10) {
          const nodeChildren = childrenMap.get(addr) || [];
          for (const childAddr of nodeChildren) {
            if (!bfsVisited.has(childAddr)) {
              queue.push({ addr: childAddr, level: level + 1, uplineName: userNode.name });
            }
          }
        }
      }
    }

    return NextResponse.json({
      referrals,
      stats: {
        lifetimeTotal: totalReferralIncome + pendingReferralIncome,
        totalReferralIncome,
        availableReferralIncome,
        pendingReferralIncome,
        withdrawnReferralIncome,
      },
    });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
