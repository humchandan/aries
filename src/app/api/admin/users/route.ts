import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ethers } from 'ethers';
import PortalFactoryArtifact from '../../../../../public/contracts/PortalFactory.json';

async function isAdmin(address: string) {
  try {
    const rpcUrls = [
      process.env.RPC_URL,
      process.env.NEXT_PUBLIC_ARIES_RPC_URL,
      'https://rpc.arieschain.org',
      'http://100.106.243.97:8545'
    ].filter(Boolean) as string[];

    let activeUrl = '';
    for (const url of rpcUrls) {
      const rpcCheck = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
        signal: AbortSignal.timeout(1500)
      }).catch(() => null);
      
      if (rpcCheck && rpcCheck.ok) {
        activeUrl = url;
        break;
      }
    }

    if (!activeUrl) {
      throw new Error("All RPC nodes unreachable");
    }

    const provider = new ethers.JsonRpcProvider(activeUrl);
    const contract = new ethers.Contract(
      PortalFactoryArtifact.address,
      PortalFactoryArtifact.abi,
      provider
    );
    const owner = await contract.owner();
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Admin check failed:", error);
    // Fallback to hardcoded admins if RPC fails temporarily
    const fallbackAdmins = process.env.ADMIN_ADDRESSES?.split(',') || ['0xd01c1bfc96e22a9470c186e69e0a97e18eff23e6'];
    return fallbackAdmins.some(a => a.toLowerCase() === address.toLowerCase());
  }
}

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAdminRights = await isAdmin(walletAddress);
  if (!hasAdminRights) {
    return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    const serializedUsers = users.map(u => ({
      ...u,
      yieldBalance: u.yieldBalance?.toString() || "0",
    }));

    return NextResponse.json({ users: serializedUsers });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
