import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-captions-scraper';
import { cleanString, isMatch } from './utils';

// Helper to parse LRC timestamp [mm:ss.xx] to seconds
function parseLrcTime(timeStr: string): number {
    // [00:12.50] -> 12.5
    const match = timeStr.match(/\[(\d+):(\d+\.?\d*)\]/);
    if (!match) return 0;
    const minutes = parseInt(match[1]);
    const seconds = parseFloat(match[2]);
    return minutes * 60 + seconds;
}

// Helper to parse LRC content
function parseLRC(lrcContent: string) {
    const lines = lrcContent.split('\n');
    const result = [];
    for (const line of lines) {
        const timeMatch = line.match(/\[(\d+):(\d+\.?\d*)\]/);
        if (timeMatch) {
            const time = parseLrcTime(timeMatch[0]);
            const text = line.replace(/\[\d+:\d+\.?\d*\]/, '').trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const artistRaw = searchParams.get('artist') || '';
    const titleRaw = searchParams.get('title') || '';
    const videoId = searchParams.get('videoId');

    if (!titleRaw) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const getBaseTitle = (str: string) => {
        const parts = str.split(/ - | – | — /);
        return cleanString(parts[0]);
    };

    const artistClean = cleanString(artistRaw);
    const titleClean = cleanString(titleRaw);
    const titleBase = getBaseTitle(titleRaw);

    const searchQueries = [
        `${artistClean} ${titleClean}`,
        titleBase,
        titleClean
    ];
    const uniqueQueries = [...new Set(searchQueries)].filter(q => q.length > 1);

    console.log(`Lyrics Search (Synced Mode) for [${titleRaw}]:`, uniqueQueries);

    // 1. Try Lrclib (Check for syncedLyrics first)
    for (const query of uniqueQueries) {
        try {
            const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
            if (lrcRes.ok) {
                const data = await lrcRes.json();
                if (!Array.isArray(data)) continue;

                // Priority 1: Synced Lyrics with strict match
                let match = data.find((item: any) => item.syncedLyrics && isMatch(item, artistClean, titleClean));

                if (match) {
                    console.log(`Found SYNCED lyrics in Lrclib for "${query}" -> ${match.trackName} by ${match.artistName}`);
                    return NextResponse.json({
                        type: 'synced',
                        lines: parseLRC(match.syncedLyrics),
                        source: 'lrclib-synced'
                    });
                }

                // Priority 2: Plain Lyrics with strict match
                match = data.find((item: any) => item.plainLyrics && isMatch(item, artistClean, titleClean));

                if (match) {
                    return NextResponse.json({
                        type: 'plain',
                        lines: match.plainLyrics.split('\n').map((t: string) => ({ time: 0, text: t })),
                        source: 'lrclib-plain'
                    });
                }
            }
        } catch (e) { }
    }

    // 2. Fallback: YouTube Captions (These are synced by default!)
    if (videoId) {
        const langs = ['en', 'ja', 'es', 'pt', 'ko', 'de', 'fr', 'it', 'auto'];
        for (const lang of langs) {
            try {
                const captions = await getSubtitles({
                    videoID: videoId,
                    lang: lang
                });

                if (captions && captions.length > 0) {
                    // Map captions to synced lines
                    // Captions have 'start' (string "1.50") and 'text'
                    const syncedLines = captions.map((c: any) => ({
                        time: parseFloat(c.start),
                        text: c.text
                    }));

                    const langPrefix = lang === 'en' ? '' : `[${lang.toUpperCase()}] `;
                    if (langPrefix) syncedLines[0].text = langPrefix + syncedLines[0].text;

                    return NextResponse.json({
                        type: 'synced',
                        lines: syncedLines,
                        source: `youtube-captions-${lang}`
                    });
                }
            } catch (err) { continue; }
        }
    }

    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
}
