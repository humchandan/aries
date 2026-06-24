import { verifyAdmin, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  const isAdmin = await verifyAdmin(walletAddress);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        aadharFrontUrl: { not: null },
      },
      select: {
        walletAddress: true,
        name: true,
        mobile: true,
        kycStatus: true,
        aadharFrontUrl: true,
        aadharBackUrl: true,
        panCardUrl: true,
        aadhaarNo: true,
        panNo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, users });
  } catch (err) {
    console.error("Failed to fetch KYC users:", err);
    return Response.json({ error: "Failed to load KYC records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const walletAddress = verifyToken(request);
  const isAdmin = await verifyAdmin(walletAddress);
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userAddress, status } = body;

    if (!userAddress || !status || !["Verified", "Rejected", "Pending", "Unverified"].includes(status)) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { walletAddress: userAddress },
      data: { kycStatus: status },
    });

    return Response.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Failed to update KYC status:", err);
    return Response.json({ error: "Failed to update KYC status" }, { status: 500 });
  }
}
