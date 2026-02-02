import { NextResponse } from 'next/server';
import { searchMusic, searchAlbums } from '@/lib/ytmusic';

export async function GET() {
    try {
        // 1. Fetch Trending Songs (Simulated via Search)
        // Since we dropped googleapis, we search for a "Top Hits" query
        const trendingRaw = await searchMusic("Top Global Hits 2026");
        const trending = trendingRaw.slice(0, 20).map(t => ({
            ...t,
            views: '1M+' // Mock views since scraper might not return them
        }));

        // 2. Fetch "New Albums" - using searchAlbums for clean single cover images
        const newReleasesRaw = await searchAlbums("New Albums 2026");
        const newReleases = newReleasesRaw.map(p => ({
            ...p,
            type: 'album'
        }));

        // 3. Moods
        const moods = [
            { id: 'rock', name: 'Rock', color: '#EF4444' },
            { id: 'pop', name: 'Pop', color: '#EC4899' },
            { id: 'hip-hop', name: 'Hip Hop', color: '#8B5CF6' },
            { id: 'latin', name: 'Latin', color: '#F59E0B' },
            { id: 'jazz', name: 'Jazz', color: '#F97316' },
            { id: 'lofi', name: 'Lofi', color: '#10B981' },
            { id: 'electronic', name: 'Electronic', color: '#06B6D4' },
            { id: 'classical', name: 'Classical', color: '#6366F1' },
            { id: 'r-n-b', name: 'R&B', color: '#3B82F6' },
            { id: 'k-pop', name: 'K-Pop', color: '#DB2777' },
        ];

        return NextResponse.json({
            trending,
            newReleases,
            moods
        });

    } catch (error) {
        console.error("Explore API Error:", error);
        return NextResponse.json({ error: "Failed to fetch explore data" }, { status: 500 });
    }
}
