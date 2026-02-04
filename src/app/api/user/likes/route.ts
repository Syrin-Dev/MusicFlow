import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';

export async function GET() {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
        return NextResponse.json([]);
    }

    try {
        const user = await (prisma as any).user.findUnique({
            where: { email: session.user.email },
            include: {
                likedSongs: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        track: true
                    }
                }
            }
        });

        // If some likes don't have trackId linked, we'll need to fetch those tracks too
        const likesWithNoTrack = (user as any)?.likedSongs.filter((l: any) => !l.track) || [];
        const videoIdsWithNoTrack = likesWithNoTrack.map((l: any) => l.videoId);

        let additionalTracks = [];
        if (videoIdsWithNoTrack.length > 0) {
            additionalTracks = await (prisma as any).track.findMany({
                where: { id: { in: videoIdsWithNoTrack } }
            });
        }

        const trackMap = new Map(additionalTracks.map((t: any) => [t.id, t]));

        const mappedLikes = (user as any)?.likedSongs.map((l: any) => {
            const track = l.track || trackMap.get(l.videoId);
            return {
                id: l.videoId,
                title: (track as any)?.title || 'Unknown',
                artist: (track as any)?.artist || 'Unknown',
                thumbnail: (track as any)?.thumbnail || `https://i.ytimg.com/vi/${l.videoId}/hqdefault.jpg`
            };
        }) || [];

        return NextResponse.json(mappedLikes);
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
        const user = await (prisma as any).user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Ensure Track exists
        await (prisma as any).track.upsert({
            where: { id },
            update: { title, artist, thumbnail },
            create: { id, title, artist, thumbnail }
        });

        // 2. Check if already liked
        const existingLike = await (prisma.likedSong as any).findUnique({
            where: {
                userId_videoId: {
                    userId: user.id,
                    videoId: id
                }
            }
        });

        if (existingLike) {
            // Unlike
            await (prisma.likedSong as any).delete({
                where: { id: (existingLike as any).id }
            });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await (prisma.likedSong as any).create({
                data: {
                    userId: user.id,
                    videoId: id,
                    trackId: id
                }
            });

            // Log Activity
            await (prisma as any).activity.create({
                data: {
                    userId: user.id,
                    type: 'LIKE',
                    trackId: id
                }
            });

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Failed to toggle like:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
