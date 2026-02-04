import { NextResponse } from 'next/server';
import { searchMusic, searchPlaylists } from '@/lib/ytmusic';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'video';

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Log search query for personalization (Fire and forget, don't block response)
    getServerSession().then(async (session) => {
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
            results = await searchMusic(q);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
