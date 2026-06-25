import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAddr = walletAddress.toLowerCase();

    // 1. Fetch all users and all staking plans to build sponsor tree and calculations in-memory
    const allUsers = await prisma.user.findMany();
    const allPlans = await prisma.stakingPlan.findMany();

    // Create maps
    const userMap = {};
    const sponsorMap = {};
    allUsers.forEach((u) => {
      const addr = u.walletAddress.toLowerCase();
      userMap[addr] = u;
      const sp = u.sponsorAddress.toLowerCase();
      if (!sponsorMap[sp]) sponsorMap[sp] = [];
      sponsorMap[sp].push(u);
    });

    const investmentMap = {};
    allPlans.forEach((p) => {
      const addr = p.userAddress.toLowerCase();
      if (!investmentMap[addr]) investmentMap[addr] = 0;
      investmentMap[addr] += Number(p.amount);
    });

    // ── Metric 1: Total Team Business till date of the logged in user (Levels 1 to 10)
    // ── Metric 3: Active Accounts (under 10 levels downline) + Active among them
    // ── Metric 4: Growth Rate parameters (Level 1 business vs Level 2-10 business)
    let totalTeamBusiness = 0;
    let totalAccountsDownline = 0;
    let activeAccountsDownline = 0;

    let level1Business = 0;
    let level2To10Business = 0;

    const visited = new Set([userAddr]);

    function traverse(addr, currentLevel) {
      if (currentLevel > 10) return;
      const children = sponsorMap[addr] || [];

      children.forEach((child) => {
        const childAddr = child.walletAddress.toLowerCase();
        if (visited.has(childAddr)) return;
        visited.add(childAddr);

        totalAccountsDownline++;
        const hasInvestment = investmentMap[childAddr] && investmentMap[childAddr] > 0;
        if (hasInvestment) {
          activeAccountsDownline++;
        }

        const childInvestment = investmentMap[childAddr] || 0;
        totalTeamBusiness += childInvestment;

        if (currentLevel === 1) {
          level1Business += childInvestment;
        } else {
          level2To10Business += childInvestment;
        }

        traverse(childAddr, currentLevel + 1);
      });
    }

    traverse(userAddr, 1);

    // Self investment of logged in user
    const selfInvestment = investmentMap[userAddr] || 0;

    // ── Metric 2: Total business last month vs this month
    // Let's filter staking plans within the user's 10 levels downline
    const downlineMembers = Array.from(visited);
    downlineMembers.shift(); // Remove the user themselves to only calculate team business

    const now = new Date();
    // This month range
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Last month range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let businessThisMonth = 0;
    let businessLastMonth = 0;

    allPlans.forEach((plan) => {
      const planUser = plan.userAddress.toLowerCase();
      // Check if this plan belongs to someone in the 10-level downline
      if (visited.has(planUser) && planUser !== userAddr) {
        const planTime = new Date(plan.timestamp);
        const amt = Number(plan.amount);
        if (planTime >= startOfThisMonth) {
          businessThisMonth += amt;
        } else if (planTime >= startOfLastMonth && planTime <= endOfLastMonth) {
          businessLastMonth += amt;
        }
      }
    });

    // Option 2: MoM Team Growth Rate
    const momDiff = businessThisMonth - businessLastMonth;
    const momGrowthRate =
      businessLastMonth > 0
        ? (momDiff / businessLastMonth) * 100
        : businessThisMonth > 0
        ? 100
        : 0;

    // Option 3: Compounding Leverage Ratio
    const totalDenom = totalTeamBusiness + selfInvestment;
    const compoundingRatio = totalDenom > 0 ? (totalTeamBusiness / totalDenom) * 100 : 0;

    return Response.json({
      success: true,
      stats: {
        totalTeamBusiness,
        businessThisMonth,
        businessLastMonth,
        totalAccountsDownline,
        activeAccountsDownline,
        momGrowthRate,
        compoundingRatio,
        selfInvestment,
        level1Business,
        level2To10Business,
      },
    });
  } catch (err) {
    console.error("Failed to load dashboard metrics:", err);
    return Response.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
