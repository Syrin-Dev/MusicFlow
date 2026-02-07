import { NextRequest, NextResponse } from 'next/server';
import { findLyrics } from './core';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const artistRaw = searchParams.get('artist') || '';
    const titleRaw = searchParams.get('title') || '';
    const videoId = searchParams.get('videoId');

    if (!titleRaw) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    try {
        const result = await findLyrics(artistRaw, titleRaw, videoId);
        if (result) {
            return NextResponse.json(result);
        }
    } catch (e: any) {
        // If findLyrics throws specific error, handle it
        if (e.message === "Missing title") {
             return NextResponse.json({ error: "Missing title" }, { status: 400 });
        }
        console.error("Lyrics search error:", e);
    }

    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
}
