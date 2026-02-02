import { NextResponse } from 'next/server';
import { getSuggestions } from '@/lib/ytmusic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json([]);
    }

    const suggestions = await getSuggestions(q);
    return NextResponse.json(suggestions);
}
