import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getCustodianBalance } from '@/lib/ethers';

export async function POST(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await prisma.user.findUnique({ where: { walletAddress } });
    if (userProfile?.isBanned) {
      return Response.json({ error: 'Your account has been restricted. Utility payments are disabled.' }, { status: 403 });
    }

    const { serviceId, details, amount, saveBiller, billerName } = await request.json();
    
    if (!serviceId || !details || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // 1. Get the service details
    const service = await prisma.utilityService.findUnique({
      where: { id: parseInt(serviceId) },
      include: { category: true }
    });

    if (!service || !service.isActive) {
      return Response.json({ error: 'Service not found or inactive' }, { status: 404 });
    }

    if (numAmount < parseFloat(service.minAmount) || numAmount > parseFloat(service.maxAmount)) {
      return Response.json({ error: `Amount must be between ${service.minAmount} and ${service.maxAmount} ARES` }, { status: 400 });
    }

    // 2. Calculate user's ARES utility balance
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { userAddress: walletAddress }
    });

    let balance = 0;
    ledgerEntries.forEach(entry => {
      if (entry.type === 'DEPOSIT' || entry.type === 'TRANSFER_IN' || entry.type === 'CLAIM_DIRECT' || entry.type === 'SPEND_REFUND') {
        balance += parseFloat(entry.netAmount || entry.amount);
      } else if (entry.type === 'TRANSFER_OUT' || entry.type === 'SPEND' || entry.type === 'SPEND_PENDING') {
        balance -= parseFloat(entry.amount);
      }
    });

    if (balance < numAmount) {
      return Response.json({ error: `Insufficient ARES utility balance. You have ${balance.toFixed(2)} ARES.` }, { status: 400 });
    }

    // 3. Perform transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create request
      const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
      
      const utilityReq = await tx.utilityRequest.create({
        data: {
          userAddress: walletAddress,
          serviceId: service.id,
          serviceName: service.name,
          categoryName: service.category.name,
          details: detailsStr,
          amount: numAmount,
          status: 'PENDING'
        }
      });

      // Deduct balance as PENDING SPEND
      await tx.ledgerEntry.create({
        data: {
          userAddress: walletAddress,
          type: 'SPEND_PENDING',
          amount: numAmount,
          netAmount: numAmount,
          fee: 0,
          description: `Pending: ${service.name} payment - Req #${utilityReq.id}`,
          timestamp: new Date()
        }
      });

      // Handle save biller if requested
      let savedBiller = null;
      if (saveBiller && billerName) {
        // Check if exact same details exist for this service
        const existing = await tx.savedBiller.findFirst({
          where: {
            userAddress: walletAddress,
            serviceId: service.id,
            details: detailsStr
          }
        });

        if (!existing) {
          savedBiller = await tx.savedBiller.create({
            data: {
              userAddress: walletAddress,
              serviceId: service.id,
              billerName,
              details: detailsStr
            }
          });
        }
      }

      return { request: utilityReq, savedBiller };
    });

    return Response.json({ success: true, ...result });

  } catch (err) {
    console.error("Utility payment failed:", err);
    return Response.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
