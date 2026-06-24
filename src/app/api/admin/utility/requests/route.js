import { checkIsAdmin } from "@/lib/admin";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress || !(await checkIsAdmin(walletAddress))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const requests = await prisma.utilityRequest.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      orderBy: { timestamp: "desc" },
      include: { service: true },
    });

    return Response.json({ requests });
  } catch (err) {
    console.error("Failed to fetch utility requests:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress || !(await checkIsAdmin(walletAddress))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId, status, adminNotes, receiptUrl } = await request.json();
    const rId = parseInt(requestId);

    if (!rId || !["APPROVED", "REJECTED"].includes(status)) {
      return Response.json({ error: "Invalid request data" }, { status: 400 });
    }

    const utilityReq = await prisma.utilityRequest.findUnique({
      where: { id: rId },
    });

    if (!utilityReq) {
      return Response.json({ error: "Request not found" }, { status: 404 });
    }

    if (utilityReq.status !== "PENDING") {
      return Response.json({ error: "Request has already been processed" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.utilityRequest.update({
        where: { id: rId },
        data: { status, adminNotes, receiptUrl },
      });

      if (status === "APPROVED") {
        // 2. Resolve pending spend to completed spend in ledger
        const ledgerPending = await tx.ledgerEntry.findFirst({
          where: {
            userAddress: utilityReq.userAddress,
            type: "SPEND_PENDING",
            description: { contains: `Req #${rId}` },
          },
        });

        if (ledgerPending) {
          await tx.ledgerEntry.update({
            where: { id: ledgerPending.id },
            data: {
              type: "SPEND",
              description: ledgerPending.description.replace("Pending:", "Completed:"),
            },
          });
        }
      } else if (status === "REJECTED") {
        // 3. Create credit refund entry in ledger
        await tx.ledgerEntry.create({
          data: {
            userAddress: utilityReq.userAddress,
            type: "SPEND_REFUND",
            amount: utilityReq.amount,
            netAmount: utilityReq.amount,
            fee: 0,
            description: `Refund: ${utilityReq.serviceName} rejected - Req #${rId}`,
            timestamp: new Date(),
          },
        });
      }
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Failed to process utility request:", err);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
