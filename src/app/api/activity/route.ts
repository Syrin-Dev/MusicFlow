import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                friends: { where: { status: 'ACCEPTED' } },
                friendOf: { where: { status: 'ACCEPTED' } }
            }
        });

        if (!user) return NextResponse.json([]);

        // Get IDs of friends to filter activity
        const friendIds = [
            ...user.friends.map(f => f.friendId),
            ...user.friendOf.map(f => f.userId)
        ];

        // Fetch activities from friends + some global public ones
        const activities = await prisma.activity.findMany({
            where: {
                OR: [
                    { userId: { in: friendIds } },
                    { userId: user.id } // Include my own
                ]
            },
            include: {
                user: { select: { name: true, image: true } },
                track: true
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Activity API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
