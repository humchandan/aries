import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkIsAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const walletAddress = verifyToken(request);
  if (!walletAddress || !(await checkIsAdmin(walletAddress))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Admin can see all users and their relationships
    const allUsers = await prisma.user.findMany({
      select: {
        walletAddress: true,
        sponsorAddress: true,
        name: true,
        mobile: true,
        rank: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const stakingAggregations = await prisma.stakingPlan.groupBy({
      by: ['userAddress'],
      _sum: {
        amount: true,
      }
    });

    const stakingMap = new Map<string, number>();
    stakingAggregations.forEach(st => {
      stakingMap.set(st.userAddress.toLowerCase(), Number(st._sum.amount || 0));
    });

    // Create a map of users for easy upline lookup
    const userMap = new Map<string, any>();
    allUsers.forEach(u => {
      userMap.set(u.walletAddress.toLowerCase(), u);
    });

    const referrals = allUsers.map(user => {
      const sponsor = userMap.get(user.sponsorAddress.toLowerCase());
      return {
        walletAddress: user.walletAddress,
        sponsorAddress: user.sponsorAddress,
        name: user.name,
        mobile: user.mobile,
        rank: user.rank,
        level: sponsor ? 1 : 0, // In admin view, we can just show direct sponsor
        uplineName: sponsor ? sponsor.name : 'System/None',
        teamBusiness: stakingMap.get(user.walletAddress.toLowerCase()) || 0,
        joinedDate: user.createdAt,
      };
    });

    return NextResponse.json({ referrals });

  } catch (error) {
    console.error('Admin referrals fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
