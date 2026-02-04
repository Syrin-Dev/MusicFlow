import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';

export async function GET() {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
        return NextResponse.json([]);
    }

    try {
        const user = await (prisma.user as any).findUnique({
            where: { email: session.user.email },
        });

        if (!user) return NextResponse.json([]);

        // Get unique history (mocking "distinct" by grouping or just taking latest)
        // Prisma distinct is useful here
        const history = await (prisma as any).listeningHistory.findMany({
            where: { userId: user.id },
            orderBy: { playedAt: 'desc' },
            take: 50,
            distinct: ['videoId'],
            include: { track: true }
        });

        const historyWithNoTrack = history.filter((h: any) => !h.track);
        const videoIdsWithNoTrack = historyWithNoTrack.map((h: any) => h.videoId);

        let additionalTracks = [];
        if (videoIdsWithNoTrack.length > 0) {
            additionalTracks = await (prisma as any).track.findMany({
                where: { id: { in: videoIdsWithNoTrack } }
            });
        }

        const trackMap = new Map(additionalTracks.map((t: any) => [t.id, t]));

        const mappedHistory = history.map((h: any) => {
            const track = h.track || trackMap.get(h.videoId);
            return {
                id: h.videoId,
                title: (track as any)?.title || 'Unknown',
                artist: (track as any)?.artist || 'Unknown',
                thumbnail: (track as any)?.thumbnail || `https://i.ytimg.com/vi/${h.videoId}/hqdefault.jpg`
            };
        });

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
        const user = await (prisma.user as any).findUnique({
            where: { email: session.user.email }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Upsert Track (Source of Truth)
        await (prisma as any).track.upsert({
            where: { id },
            update: { title, artist, thumbnail },
            create: { id, title, artist, thumbnail }
        });

        // 2. Add to history
        await (prisma as any).listeningHistory.create({
            data: {
                userId: user.id,
                videoId: id,
                trackId: id
            }
        });

        // 3. Log Activity for the feed
        await (prisma as any).activity.create({
            data: {
                userId: user.id,
                type: 'TRACK_PLAYED',
                trackId: id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
