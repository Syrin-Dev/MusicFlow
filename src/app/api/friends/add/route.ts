
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await req.json();

    if (!inviteCode) {
        return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    try {
        const sender = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!sender) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Find user by unique invite code
        const targetUser = await prisma.user.findUnique({
            where: { inviteCode }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        if (targetUser.id === sender.id) {
            return NextResponse.json({ error: 'You cannot friend yourself' }, { status: 400 });
        }

        // Check if already friends or pending
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: sender.id, friendId: targetUser.id },
                    { userId: targetUser.id, friendId: sender.id }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                return NextResponse.json({ error: 'Already friends' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
        }

        // Create Friendship Request (PENDING)
        // Correct way is creating it ONE way first. The status pending implies request.
        await prisma.friendship.create({
            data: {
                userId: sender.id,
                friendId: targetUser.id,
                status: 'PENDING'
            }
        });

        // Create Notification for Target User
        await prisma.notification.create({
            data: {
                userId: targetUser.id,
                type: 'FRIEND_REQUEST',
                title: 'New Friend Request',
                message: `${sender.name || 'Someone'} sent you a friend request.`,
                link: `/profile/${sender.id}`,
            }
        });

        return NextResponse.json({ success: true, message: 'Friend request sent' });

    } catch (error) {
        console.error('Add friend error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
