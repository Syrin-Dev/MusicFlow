
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { action, friendId, trackId, progress } = await request.json();

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { lastActiveAt: new Date() },
            include: { currentRoom: true }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (action === 'CREATE_ROOM') {
            // Create or update hosting room
            const room = await prisma.listeningRoom.upsert({
                where: { hostId: user.id },
                update: {
                    activeTrackId: trackId,
                    progress: progress || 0,
                },
                create: {
                    hostId: user.id,
                    activeTrackId: trackId,
                    progress: progress || 0,
                    isPublic: false
                }
            });
            return NextResponse.json(room);
        }

        if (action === 'JOIN_ROOM') {
            const host = await prisma.user.findUnique({
                where: { id: friendId },
                include: { hostingRoom: true }
            });

            if (!host?.hostingRoom) return NextResponse.json({ error: 'No active room' }, { status: 404 });

            await prisma.user.update({
                where: { id: user.id },
                data: { currentRoomId: host.hostingRoom.id }
            });

            return NextResponse.json(host.hostingRoom);
        }

        if (action === 'LEAVE_ROOM') {
            await prisma.user.update({
                where: { id: user.id },
                data: { currentRoomId: null }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) return NextResponse.json({ error: 'RoomId required' }, { status: 400 });

    try {
        const room = await prisma.listeningRoom.findUnique({
            where: { id: roomId },
            include: {
                activeTrack: true,
                host: { select: { name: true, image: true } }
            }
        });
        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
