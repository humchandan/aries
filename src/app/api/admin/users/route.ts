import { NextResponse } from "next/server";

import { verifyAdmin, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAdminRights = await verifyAdmin(walletAddress);
  if (!hasAdminRights) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });

    const serializedUsers = users.map((u) => ({
      ...u,
      yieldBalance: u.yieldBalance?.toString() || "0",
    }));

    return NextResponse.json({ users: serializedUsers });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
