
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requesterId, action } = await req.json();

    if (!requesterId || !['ACCEPT', 'REJECT'].includes(action)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const friendship = await prisma.friendship.findFirst({
            where: {
                userId: requesterId,
                friendId: currentUser.id,
                status: 'PENDING'
            }
        });

        if (!friendship) {
            return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
        }

        if (action === 'ACCEPT') {
            // Update status to ACCEPTED
            await prisma.friendship.update({
                where: { id: friendship.id },
                data: { status: 'ACCEPTED' }
            });

            // Create reciprocal friendship (optional, but typical for bi-directional) ->
            // Actually, if we use one record for friendship, queries need to check both userId=me OR friendId=me.
            // But simplify logic: Create the reverse record so queries are easier.
            await prisma.friendship.create({
                data: {
                    userId: currentUser.id,
                    friendId: requesterId,
                    status: 'ACCEPTED'
                }
            });

            // Notify Requester
            await prisma.notification.create({
                data: {
                    userId: requesterId,
                    type: 'SYSTEM',
                    title: 'Friend Request Accepted',
                    message: `${currentUser.name} accepted your friend request.`,
                }
            });

        } else if (action === 'REJECT') {
            await prisma.friendship.delete({
                where: { id: friendship.id }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Respond friend error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
