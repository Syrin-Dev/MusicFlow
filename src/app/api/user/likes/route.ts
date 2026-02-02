import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';

export async function GET() {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
        return NextResponse.json([]);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { likedSongs: { orderBy: { createdAt: 'desc' } } }
        });

        return NextResponse.json(user?.likedSongs || []);
    } catch (error) {
        console.error('Failed to fetch likes:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, artist, thumbnail } = body;

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await prisma.likedSong.findUnique({
            where: {
                userId_videoId: {
                    userId: user.id,
                    videoId: id
                }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.likedSong.delete({
                where: { id: existingLike.id }
            });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await prisma.likedSong.create({
                data: {
                    userId: user.id,
                    videoId: id,
                    title,
                    artist,
                    thumbnail
                }
            });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Failed to toggle like:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
