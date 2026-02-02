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
        });

        if (!user) return NextResponse.json([]);

        // Get unique history (mocking "distinct" by grouping or just taking latest)
        // Prisma distinct is useful here
        const history = await prisma.listeningHistory.findMany({
            where: { userId: user.id },
            orderBy: { playedAt: 'desc' },
            take: 50,
            distinct: ['videoId'] // Keep only unique songs, taking the latest due to orderBy? 
            // NOTE: distinct with orderBy in SQLite/Postgres can be tricky, let's keep it simple: just take latest 50
        });

        // The distinct logic above works in Postgres/SQLite generally to get unique rows
        // But let's map it to Track interface
        const mappedHistory = history.map(h => ({
            id: h.videoId,
            title: h.title,
            artist: h.artist,
            thumbnail: h.thumbnail
        }));

        return NextResponse.json(mappedHistory);
    } catch (error) {
        console.error('Failed to fetch history:', error);
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

        // Add to history
        await prisma.listeningHistory.create({
            data: {
                userId: user.id,
                videoId: id,
                title,
                artist,
                thumbnail
            }
        });

        // Optional: Clean up old history if it gets too big (e.g. keep last 100)

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
