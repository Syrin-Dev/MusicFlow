import { NextRequest, NextResponse } from 'next/server';
import { searchAlbums, searchMusic } from '@/lib/ytmusic';

// Different search queries to get variety of albums/songs
const albumQueries = [
    "New Albums 2026",
    "Top Albums 2025",
    "Best Albums Hip Hop",
    "New Pop Albums",
    "Rock Albums New",
    "Electronic Music Albums",
    "R&B Soul Albums",
    "Country Music Albums",
    "Latin Music Albums",
    "K-Pop Albums New",
    "Indie Albums 2026",
    "Alternative Rock Albums"
];

const songQueries = [
    "Top Hits 2026",
    "Trending Songs Global",
    "New Music Friday",
    "Viral Hits 2026",
    "Best Pop Songs",
    "Top Hip Hop Songs",
    "Rock Hits",
    "Electronic Dance Music",
    "Chill Vibes Music"
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '0');
        const type = searchParams.get('type') || 'albums'; // 'albums' or 'songs'

        if (type === 'albums') {
            // Use rotating queries for variety
            const queryIndex = page % albumQueries.length;
            const query = albumQueries[queryIndex];

            const albums = await searchAlbums(query);

            return NextResponse.json({
                items: albums.map(p => ({ ...p, type: 'album' })),
                hasMore: true, // Always has more since we rotate queries
                page
            });
        } else {
            // Songs
            const queryIndex = page % songQueries.length;
            const query = songQueries[queryIndex];

            const songs = await searchMusic(query);

            return NextResponse.json({
                items: songs.slice(0, 10).map(s => ({ ...s, views: '1M+' })),
                hasMore: true,
                page
            });
        }
    } catch (error) {
        console.error("Explore More API Error:", error);
        return NextResponse.json({ error: "Failed to fetch more content" }, { status: 500 });
    }
}
