import { getSubtitles } from 'youtube-captions-scraper';

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

export async function findLyrics(artistRaw: string, titleRaw: string, videoId: string | null) {
    if (!titleRaw) {
        throw new Error("Missing title");
    }

    // Cleaning logic
    const cleanString = (str: string) => {
        return str
            .replace(/\(.*\)/g, '')
            .replace(/\[.*\]/g, '')
            .replace(/official video/gi, '')
            .replace(/music video/gi, '')
            .replace(/lyrics/gi, '')
            .replace(/ft\./gi, '')
            .replace(/feat\./gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

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

    // 1. Try Lrclib (Check for syncedLyrics first) - Parallelized
    // Create promises for all queries
    const lrclibPromises = uniqueQueries.map(async (query) => {
        try {
            const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
            if (!lrcRes.ok) return null;

            const data = await lrcRes.json();
            if (!Array.isArray(data)) return null;

            // Helper to check similarity
            const isMatch = (item: any) => {
                if (item.instrumental) return false; // Skip explicit instrumentals for now

                const itemArtist = cleanString(item.artistName || '').toLowerCase();
                const itemTitle = cleanString(item.trackName || '').toLowerCase();
                const searchArtist = artistClean.toLowerCase();
                const searchTitle = titleClean.toLowerCase();

                // Check if title contains the search title or vice versa
                const titleMatch = itemTitle.includes(searchTitle) || searchTitle.includes(itemTitle);

                // Check artist match (loose)
                // If no artist supplied in search, rely mostly on title
                const artistMatch = !searchArtist || itemArtist.includes(searchArtist) || searchArtist.includes(itemArtist);

                return titleMatch && artistMatch;
            };

            // Priority 1: Synced Lyrics with strict match
            let match = data.find((item: any) => item.syncedLyrics && isMatch(item));

            if (match) {
                console.log(`Found SYNCED lyrics in Lrclib for "${query}" -> ${match.trackName} by ${match.artistName}`);
                return {
                    type: 'synced',
                    lines: parseLRC(match.syncedLyrics),
                    source: 'lrclib-synced'
                };
            }

            // Priority 2: Plain Lyrics with strict match
            match = data.find((item: any) => item.plainLyrics && isMatch(item));

            if (match) {
                return {
                    type: 'plain',
                    lines: match.plainLyrics.split('\n').map((t: string) => ({ time: 0, text: t })),
                    source: 'lrclib-plain'
                };
            }
        } catch (e) {
            // Network errors for one query shouldn't fail others
        }
        return null;
    });

    // Check results in priority order
    for (const p of lrclibPromises) {
        const result = await p;
        if (result) return result;
    }

    // 2. Fallback: YouTube Captions (These are synced by default!) - Parallelized
    if (videoId) {
        const langs = ['en', 'ja', 'es', 'pt', 'ko', 'de', 'fr', 'it', 'auto'];

        const captionPromises = langs.map(async (lang) => {
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

                    return {
                        type: 'synced',
                        lines: syncedLines,
                        source: `youtube-captions-${lang}`
                    };
                }
            } catch (err) { }
            return null;
        });

        for (const p of captionPromises) {
            const result = await p;
            if (result) return result;
        }
    }

    return null;
}
