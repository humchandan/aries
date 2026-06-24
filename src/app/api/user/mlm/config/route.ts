import { NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiers = await prisma.mlmTier.findMany({ orderBy: { id: "asc" } });
    const levels = await prisma.mlmLevel.findMany({ orderBy: { level: "asc" } });

    return NextResponse.json({ tiers, levels });
  } catch (error) {
    console.error("Fetch MLM config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
