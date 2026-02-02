import { NextResponse } from 'next/server';
import { searchMusic, searchPlaylists } from '@/lib/ytmusic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'video'; // 'video' or 'playlist'

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

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
