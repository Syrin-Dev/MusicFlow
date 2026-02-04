
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
        return NextResponse.json({ error: 'Missing friendId' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: friendId },
                    { senderId: friendId, receiverId: user.id }
                ]
            },
            orderBy: { createdAt: 'asc' },
            take: 50 // Limit content history for performance
        });

        // Also update lastActiveAt since the user is fetching messages
        await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { receiverId, content, sharedMusic } = await req.json();

        if (!receiverId || (!content && !sharedMusic)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const messageData: any = {
            senderId: user.id,
            receiverId: receiverId,
            content: content || null,
        };

        if (sharedMusic) {
            messageData.sharedMusicId = sharedMusic.id;
            messageData.sharedMusicTitle = sharedMusic.title;
            messageData.sharedMusicArtist = sharedMusic.artist;
            messageData.sharedMusicImg = sharedMusic.thumbnail;
        }

        const newMessage = await prisma.message.create({
            data: messageData
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error("Message Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
