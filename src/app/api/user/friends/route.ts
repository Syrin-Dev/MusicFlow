
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user: any = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                friends: {
                    where: { status: 'ACCEPTED' },
                    include: { friend: true }
                },
                friendOf: {
                    where: { status: 'ACCEPTED' },
                    include: { user: true }
                }
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Merge both sides of friendship
        const sentFriends = user.friends.map(f => {
            const lastActive = f.friend.lastActiveAt;
            const isOnline = lastActive ? (new Date().getTime() - new Date(lastActive).getTime() < 120000) : false;

            return {
                id: f.friend.id,
                name: f.friend.name,
                image: f.friend.image,
                status: isOnline ? 'Online' : 'Offline',
                lastActiveAt: lastActive
            };
        });

        const receivedFriends = user.friendOf.map(f => {
            const lastActive = f.user.lastActiveAt;
            const isOnline = lastActive ? (new Date().getTime() - new Date(lastActive).getTime() < 120000) : false;

            return {
                id: f.user.id,
                name: f.user.name,
                image: f.user.image,
                status: isOnline ? 'Online' : 'Offline',
                lastActiveAt: lastActive
            };
        });

        const allFriends = [...sentFriends, ...receivedFriends];
        // Unique by ID
        const uniqueFriends = Array.from(new Map(allFriends.map(item => [item.id, item])).values());

        return NextResponse.json(uniqueFriends);
    } catch (error) {
        console.error("Friends API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
