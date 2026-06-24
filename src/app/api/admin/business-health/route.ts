import { verifyAdmin, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  const isAdmin = await verifyAdmin(walletAddress);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ignoredWallets = ["0xd01c1bfc96e22a9470c186e69e0a97e18eff23e6", "0x6f8f3ccd90d63d24ed54270c03803cf12dbb6a32"];

    const elevenMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 11));

    const [entries, stakes, claims] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { timestamp: { gte: elevenMonthsAgo } },
      }),
      prisma.stakingPlan.findMany({
        where: { timestamp: { gte: elevenMonthsAgo } },
      }),
      prisma.claimHistory.findMany({
        where: { timestamp: { gte: elevenMonthsAgo } },
      }),
    ]);

    const dataMap: Record<string, { sales: number; outflow: number }> = {};

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7); // YYYY-MM
      dataMap[monthKey] = { sales: 0, outflow: 0 };
    }

    // Proxy deposits (fresh money) & Utility spending
    entries.forEach((entry) => {
      if (ignoredWallets.includes(entry.userAddress.toLowerCase())) return;
      const monthKey = entry.timestamp.toISOString().substring(0, 7);
      if (dataMap[monthKey]) {
        const amount = Number(entry.amount);
        if (entry.type === "DEPOSIT") {
          dataMap[monthKey].sales += amount;
        } else if (entry.type === "WITHDRAWAL" || entry.type === "UTILITY_PAYMENT" || entry.type === "TRANSFER_OUT") {
          dataMap[monthKey].outflow += amount;
        }
      }
    });

    // Staking done
    stakes.forEach((stake) => {
      if (ignoredWallets.includes(stake.userAddress.toLowerCase())) return;
      const monthKey = stake.timestamp.toISOString().substring(0, 7);
      if (dataMap[monthKey]) {
        dataMap[monthKey].sales += Number(stake.amount);
      }
    });

    // Withdrawals made to Metamask or Utility Portal
    claims.forEach((claim) => {
      if (ignoredWallets.includes(claim.userAddress.toLowerCase())) return;
      const monthKey = claim.timestamp.toISOString().substring(0, 7);
      if (dataMap[monthKey]) {
        dataMap[monthKey].outflow += Number(claim.grossAmount);
      }
    });

    const chartData = Object.keys(dataMap)
      .sort()
      .map((key) => ({
        date: key + "-01T00:00:00.000Z",
        sales: dataMap[key].sales,
        outflow: dataMap[key].outflow,
      }));

    return Response.json({ success: true, data: chartData });
  } catch (err) {
    console.error("Failed to fetch business health:", err);
    return Response.json({ error: "Failed to load business health" }, { status: 500 });
  }
}
