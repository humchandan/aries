import { NextResponse } from "next/server";

import { verifyAdmin, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAdminRights = await verifyAdmin(walletAddress);
  if (!hasAdminRights) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { targetAddress, isBanned } = body;

    if (!targetAddress) {
      return NextResponse.json({ error: "Target address is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { walletAddress: targetAddress },
      data: { isBanned: Boolean(isBanned) },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
