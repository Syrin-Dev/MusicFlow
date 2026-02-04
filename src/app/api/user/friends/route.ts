
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
        const user = await prisma.user.findUnique({
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
        const sentFriends = user.friends.map(f => ({
            id: f.friend.id,
            name: f.friend.name,
            image: f.friend.image,
            status: 'Offline' // Placeholder status
        }));

        const receivedFriends = user.friendOf.map(f => ({
            id: f.user.id,
            name: f.user.name,
            image: f.user.image,
            status: 'Offline'
        }));

        // Deduplicate if necessary (though query should be clean if handled right, simplified here)
        // With logic "A accepted B" and "B accepted A", we might have duplicates if we created 2 records.
        // If we created 2 records for ACCEPTED, this merge is correct.

        const allFriends = [...sentFriends, ...receivedFriends];
        // Unique by ID
        const uniqueFriends = Array.from(new Map(allFriends.map(item => [item.id, item])).values());

        return NextResponse.json(uniqueFriends);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
