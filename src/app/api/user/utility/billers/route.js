import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const billers = await prisma.savedBiller.findMany({
      where: { userAddress: walletAddress },
      include: {
        service: {
          include: { category: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return Response.json({ billers });
  } catch (err) {
    console.error("Failed to fetch saved billers:", err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { serviceId, billerName, details } = await request.json();

    if (!serviceId || !billerName || !details) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const biller = await prisma.savedBiller.create({
      data: {
        userAddress: walletAddress,
        serviceId: parseInt(serviceId),
        billerName,
        details: typeof details === 'string' ? details : JSON.stringify(details)
      },
      include: { service: { include: { category: true } } }
    });

    return Response.json({ success: true, biller });
  } catch (err) {
    console.error("Failed to create saved biller:", err);
    return Response.json({ error: 'Failed to create biller' }, { status: 500 });
  }
}

export async function PUT(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, billerName, details } = await request.json();

    if (!id || !billerName || !details) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.savedBiller.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.userAddress !== walletAddress) {
      return Response.json({ error: 'Biller not found or unauthorized' }, { status: 404 });
    }

    const biller = await prisma.savedBiller.update({
      where: { id: parseInt(id) },
      data: {
        billerName,
        details: typeof details === 'string' ? details : JSON.stringify(details)
      },
      include: { service: { include: { category: true } } }
    });

    return Response.json({ success: true, biller });
  } catch (err) {
    console.error("Failed to update saved biller:", err);
    return Response.json({ error: 'Failed to update biller' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) {
      return Response.json({ error: 'Biller ID is required' }, { status: 400 });
    }

    const existing = await prisma.savedBiller.findUnique({ where: { id } });
    if (!existing || existing.userAddress !== walletAddress) {
      return Response.json({ error: 'Biller not found or unauthorized' }, { status: 404 });
    }

    await prisma.savedBiller.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Failed to delete saved biller:", err);
    return Response.json({ error: 'Failed to delete biller' }, { status: 500 });
  }
}
