
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { receiverId } = await request.json();

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                typingToId: receiverId,
                lastTypingAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) return NextResponse.json({ error: 'FriendId required' }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: friendId },
            select: {
                typingToId: true,
                lastTypingAt: true,
                id: true
            }
        });

        if (!user) return NextResponse.json({ isTyping: false });

        const me = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        // If friend is typing to ME and was active in the last 4 seconds
        const isTyping = user.typingToId === me?.id &&
            user.lastTypingAt &&
            (new Date().getTime() - new Date(user.lastTypingAt).getTime() < 4000);

        return NextResponse.json({ isTyping: !!isTyping });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
