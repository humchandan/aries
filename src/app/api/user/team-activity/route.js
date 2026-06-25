import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAddr = walletAddress.toLowerCase();

    // 1. Fetch all users and staking plans to map network hierarchy
    const allUsers = await prisma.user.findMany();
    const allPlans = await prisma.stakingPlan.findMany({
      orderBy: { timestamp: "asc" },
    });

    const userMap = {};
    const sponsorMap = {};
    allUsers.forEach((u) => {
      const addr = u.walletAddress.toLowerCase();
      userMap[addr] = u;
      const sp = u.sponsorAddress.toLowerCase();
      if (!sponsorMap[sp]) sponsorMap[sp] = [];
      sponsorMap[sp].push(u);
    });

    // 2. Identify the 10-level downline members
    const downlineSet = new Set();
    const visited = new Set([userAddr]);

    function traverse(addr, currentLevel) {
      if (currentLevel > 10) return;
      const children = sponsorMap[addr] || [];
      children.forEach((child) => {
        const childAddr = child.walletAddress.toLowerCase();
        if (visited.has(childAddr)) return;
        visited.add(childAddr);
        downlineSet.add(childAddr);
        traverse(childAddr, currentLevel + 1);
      });
    }
    traverse(userAddr, 1);

    // 3. Generate daily/monthly history points for the last 30 days
    // Let's gather staking plans that belong to the downline
    const downlinePlans = allPlans.filter((p) => downlineSet.has(p.userAddress.toLowerCase()));
    
    // We want daily statistics for the last 30 days:
    // - New registrations in downline
    // - Active downline members (who have active staking)
    // - Cumulative Team Staking Business
    
    const chartData = [];
    const now = new Date();
    
    // Initialize past 30 days array
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateString = d.toISOString().substring(0, 10); // YYYY-MM-DD
      chartData.push({
        date: dateString,
        newRegistrations: 0,
        activeStakers: 0,
        teamStakingVolume: 0,
      });
    }

    // Populate data for each day
    chartData.forEach((dayData) => {
      const targetDate = new Date(dayData.date);
      const endOfTargetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      // A. Count downline registrations up to this day
      let newRegCountOnDay = 0;
      allUsers.forEach((u) => {
        const uAddr = u.walletAddress.toLowerCase();
        if (downlineSet.has(uAddr)) {
          const regDate = new Date(u.createdAt);
          // New registrations specifically on this day
          if (regDate.toISOString().substring(0, 10) === dayData.date) {
            newRegCountOnDay++;
          }
        }
      });
      dayData.newRegistrations = newRegCountOnDay;

      // B. Compute active stakers up to this day
      // Active stakers is the count of unique users who have staked >= 1 ARES up to this target day
      const stakersUpToDay = new Set();
      downlinePlans.forEach((plan) => {
        const planTime = new Date(plan.timestamp);
        if (planTime <= endOfTargetDay) {
          stakersUpToDay.add(plan.userAddress.toLowerCase());
        }
      });
      dayData.activeStakers = stakersUpToDay.size;

      // C. Cumulative Team Staking Volume up to this day
      let totalVolumeUpToDay = 0;
      downlinePlans.forEach((plan) => {
        const planTime = new Date(plan.timestamp);
        if (planTime <= endOfTargetDay) {
          totalVolumeUpToDay += Number(plan.amount);
        }
      });
      dayData.teamStakingVolume = totalVolumeUpToDay;
    });

    return Response.json({
      success: true,
      chartData,
    });
  } catch (err) {
    console.error("Failed to load customer activity stats:", err);
    return Response.json({ error: "Failed to load customer activity stats" }, { status: 500 });
  }
}
