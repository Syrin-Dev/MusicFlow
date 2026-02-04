import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId, role = 'VIEWER' } = await req.json();
    const { id: playlistId } = await params;

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Check if user is OWNER or EDITOR to add others
        const membership = await prisma.playlistMember.findUnique({
            where: { playlistId_userId: { playlistId, userId: user.id } }
        });

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'EDITOR')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const newMember = await prisma.playlistMember.upsert({
            where: { playlistId_userId: { playlistId, userId: friendId } },
            update: { role },
            create: { playlistId, userId: friendId, role }
        });

        // Log Activity
        await prisma.activity.create({
            data: {
                userId: user.id,
                type: 'FRIEND_ADDED',
                targetUserId: friendId,
                playlistId
            }
        });

        return NextResponse.json(newMember);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
