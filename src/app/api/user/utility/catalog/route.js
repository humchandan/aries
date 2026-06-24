import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.utilityCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });

    return Response.json({ categories });
  } catch (err) {
    console.error("Failed to fetch utility catalog:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
