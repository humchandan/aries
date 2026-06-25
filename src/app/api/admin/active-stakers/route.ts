import type { StakingPlan, User } from "@prisma/client";

import { verifyAdmin, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TARGET_WALLET = "0x6bb20c85115a44b4120d1ca02b5f44fa87ae6530";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  const isAdmin = await verifyAdmin(walletAddress);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await prisma.user.findMany();
    const allPlans = await prisma.stakingPlan.findMany();

    // Map investments
    const investmentMap: Record<string, number> = {};
    allPlans.forEach((p: StakingPlan) => {
      const addr = p.userAddress.toLowerCase();
      if (!investmentMap[addr]) investmentMap[addr] = 0;
      investmentMap[addr] += Number(p.amount);
    });

    // Map sponsors
    const sponsorMap: Record<string, User[]> = {};
    const userMap: Record<string, User> = {};
    allUsers.forEach((u: User) => {
      const sp = u.sponsorAddress.toLowerCase();
      if (!sponsorMap[sp]) sponsorMap[sp] = [];
      sponsorMap[sp].push(u);
      userMap[u.walletAddress.toLowerCase()] = u;
    });

    // Calculate level depth from TARGET_WALLET
    function getLevelFromTarget(addr: string): number {
      let currentAddr = addr.toLowerCase();
      let level = 0;
      const visited = new Set<string>([currentAddr]);

      while (
        currentAddr &&
        currentAddr !== TARGET_WALLET &&
        currentAddr !== "0x0000000000000000000000000000000000000000"
      ) {
        const user = userMap[currentAddr];
        if (!user || !user.sponsorAddress) {
          level = -1; // Unreachable
          break;
        }
        currentAddr = user.sponsorAddress.toLowerCase();
        if (visited.has(currentAddr)) {
          level = -1;
          break;
        }
        visited.add(currentAddr);
        level++;
      }
      return currentAddr === TARGET_WALLET ? level : -1;
    }

    function getTeamVolume(downlineAddr: string) {
      let volume = 0;
      const visited = new Set([downlineAddr.toLowerCase()]);

      function traverse(addr: string, currentLevel: number) {
        if (currentLevel > 100) return;
        const cleanAddr = addr.toLowerCase();
        const children = sponsorMap[cleanAddr] || [];
        children.forEach((child: User) => {
          const childAddr = child.walletAddress.toLowerCase();
          if (visited.has(childAddr)) return;
          visited.add(childAddr);

          const childInvestment = investmentMap[childAddr] || 0;
          volume += childInvestment;
          traverse(childAddr, currentLevel + 1);
        });
      }

      traverse(downlineAddr, 1);
      return volume;
    }

    // Filter active stakers
    const activeStakers = allUsers.filter((u: User) => {
      const addr = u.walletAddress.toLowerCase();
      return investmentMap[addr] && investmentMap[addr] > 0;
    });

    const data = activeStakers.map((u: User) => {
      const addr = u.walletAddress.toLowerCase();
      const level = getLevelFromTarget(addr);

      return {
        id: u.id,
        mobile: u.mobile,
        name: u.name,
        walletAddress: u.walletAddress,
        rank: u.rank,
        level: level >= 0 ? level : "N/A",
        staked: investmentMap[addr] || 0,
        teamVolume: getTeamVolume(addr),
      };
    });

    // Sort by staked amount descending
    data.sort((a: any, b: any) => b.staked - a.staked);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Failed to fetch active stakers", err);
    return Response.json({ error: "Failed to load active stakers" }, { status: 500 });
  }
}
