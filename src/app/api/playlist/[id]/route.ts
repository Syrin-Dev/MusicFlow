import { NextResponse } from 'next/server';
import { getPlaylistDetails } from '@/lib/ytmusic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params in case using newer Next.js version where it is a Promise
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
        }

        const playlist = await getPlaylistDetails(id);

        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        return NextResponse.json(playlist);
    } catch (error) {
        console.error("Playlist API Error:", error);
        return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
    }
}
