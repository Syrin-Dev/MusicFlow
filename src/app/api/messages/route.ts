
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
            include: {
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        sharedMusicTitle: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: 100
        });

        // Also update lastActiveAt
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
        const { receiverId, content, sharedMusic, replyToId } = await req.json();

        if (!receiverId || (!content && !sharedMusic)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Check for accepted friendship
        const friendship = await prisma.friendship.findUnique({
            where: {
                userId_friendId: {
                    userId: user.id,
                    friendId: receiverId
                }
            }
        });

        if (!friendship || friendship.status !== 'ACCEPTED') {
            return NextResponse.json({ error: 'You must be friends to send messages' }, { status: 403 });
        }

        const messageData: any = {
            senderId: user.id,
            receiverId: receiverId,
            content: content || null,
            replyToId: replyToId || null
        };

        if (sharedMusic) {
            messageData.sharedMusicId = sharedMusic.id;
            messageData.sharedMusicTitle = sharedMusic.title;
            messageData.sharedMusicArtist = sharedMusic.artist;
            messageData.sharedMusicThumbnail = sharedMusic.thumbnail;

            // Ensure track exists in system
            await prisma.track.upsert({
                where: { id: sharedMusic.id },
                update: {},
                create: {
                    id: sharedMusic.id,
                    title: sharedMusic.title,
                    artist: sharedMusic.artist,
                    thumbnail: sharedMusic.thumbnail
                }
            });
        }

        const newMessage = await prisma.message.create({
            data: messageData,
            include: {
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        sharedMusicTitle: true
                    }
                }
            }
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error("Message Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get('id');

        if (!messageId) {
            return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Check if message belongs to user
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message || message.senderId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized delete' }, { status: 403 });
        }

        await prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                content: "Message deleted"
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
