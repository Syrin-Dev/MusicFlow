import { NextResponse } from 'next/server';
import { getArtistData } from '@/lib/ytmusic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Name parameter required' }, { status: 400 });
    }

    try {
        const artistData = await getArtistData(name);
        if (!artistData) {
            return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
        }
        return NextResponse.json(artistData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch artist data' }, { status: 500 });
    }
}
