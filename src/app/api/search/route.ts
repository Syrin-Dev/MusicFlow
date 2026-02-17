import { NextResponse } from 'next/server';
import { searchMusic, searchPlaylists } from '@/lib/ytmusic';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'video';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '30');

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
            results = await searchPlaylists(q);
        } else {
            // Use reliable YouTube Music API (works correctly for artist searches)
            const allResults = await searchMusic(q);

            // Apply pagination
            results = allResults.slice(offset, offset + limit);

            // Return with pagination metadata
            return NextResponse.json({
                results,
                total: allResults.length,
                offset,
                limit,
                hasMore: offset + limit < allResults.length
            });
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
