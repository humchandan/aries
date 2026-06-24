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

        // Let's include their own:
        total += stakingMap.get(current) || 0;

        const children = childrenMap.get(current) || [];
        for (const child of children) {
          stack.push(child);
        }
      }
      return total;
    };

    // 4. Traverse up to 10 levels to find the referrals
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

        referrals.push({
          walletAddress: userNode.walletAddress,
          sponsorAddress: userNode.sponsorAddress,
          name: userNode.name,
          // Hide mobile if level > 1
          mobile: level === 1 ? userNode.mobile : "***-***-****",
          rank: userNode.rank,
          level,
          uplineName,
          teamBusiness,
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

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
