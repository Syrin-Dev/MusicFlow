import { NextResponse } from 'next/server';
import { searchUnified } from '@/lib/aggregator';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // Type is mostly used for playlists vs songs. Unified search currently focuses on tracks (songs).
    // If type is playlist, we might fallback to just YouTube or implement playlist aggregation later.
    // For now, if type=video (default) or undefined, we use unified.
    const type = searchParams.get('type') || 'video';

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Log search query for personalization (Fire and forget)
    getServerSession(authOptions).then(async (session) => {
        if (session?.user?.email) {
            try {
                const user = await prisma.user.findUnique({ where: { email: session.user.email } });
                if (user) {
                    await prisma.userSearch.upsert({
                        where: { userId_query: { userId: user.id, query: q.toLowerCase() } },
                        update: { count: { increment: 1 }, lastSearched: new Date() },
                        create: { userId: user.id, query: q.toLowerCase() }
                    });
                }
            } catch (e) {
                console.error("Failed to log search:", e);
            }
        }
    });

    try {
        let results;

        if (type === 'playlist') {
            // Fallback to legacy behavior for playlists until aggregated playlists are supported
            // We need to dynamically import to avoid circular deps if any, or just import normally
            const { searchPlaylists } = await import('@/lib/ytmusic');
            results = await searchPlaylists(q);
        } else {
            // Use new Unified Aggregator
            results = await searchUnified(q);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
