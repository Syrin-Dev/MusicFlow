
import { MusicSource, UnifiedTrack, TrackSources } from './types/music';
import { PipedSource } from './sources/piped';
import { SoundCloudSource } from './sources/soundcloud';
import { AudiusSource } from './sources/audius';

const defaultSources: MusicSource[] = [
    new PipedSource(),
    new SoundCloudSource(),
    new AudiusSource()
];

// Helper: Levenshtein Distance for fuzzy matching
function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

function cleanString(str: string): string {
    let s = str.toLowerCase();
    // Remove common suffixes/prefixes
    const garbage = [
        /\(official\s+video\)/g,
        /\(official\s+audio\)/g,
        /\(lyrics\)/g,
        /\(lyric\s+video\)/g,
        /official\s+video/g,
        /official\s+audio/g,
        /music\s+video/g,
        /ft\./g,
        /feat\./g,
        /featuring/g,
        /prod\./g,
        /with/g,
        /hd/g,
        /hq/g,
        /4k/g
    ];

    garbage.forEach(regex => {
        s = s.replace(regex, '');
    });

    return s.replace(/[^a-z0-9]/g, '');
}

function isSimilar(trackA: UnifiedTrack, trackB: UnifiedTrack): boolean {
    const titleA = cleanString(trackA.title);
    const titleB = cleanString(trackB.title);
    const artistA = cleanString(trackA.artist);
    const artistB = cleanString(trackB.artist);

    // Strict Check: Artist must be very similar
    const artistDist = levenshtein(artistA, artistB);
    const artistMax = Math.max(artistA.length, artistB.length);
    const artistScore = artistMax === 0 ? 1 : 1 - (artistDist / artistMax);

    if (artistScore < 0.8) return false; // Artists differ too much

    // Title Check: Allow fuzzy match
    const titleDist = levenshtein(titleA, titleB);
    const titleMax = Math.max(titleA.length, titleB.length);
    const titleScore = titleMax === 0 ? 1 : 1 - (titleDist / titleMax);

    return titleScore > 0.85; // Slightly relaxed threshold after cleaning
}

export async function searchUnified(query: string, injectedSources?: MusicSource[]): Promise<UnifiedTrack[]> {
    const sourcesToUse = injectedSources || defaultSources;

    // 1. Parallel Fetch
    const results = await Promise.allSettled(sourcesToUse.map(s => s.search(query)));

    const allTracks: UnifiedTrack[] = [];
    results.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allTracks.push(...res.value);
        }
    });

    // 2. Merge Strategy
    // Sort by priority before merging: Verified > Platform (YT > SC > Audius)
    allTracks.sort((a, b) => {
        if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1;
        const score = (p: string) => p === 'youtube' ? 3 : p === 'soundcloud' ? 2 : 1;
        return score(b.platform as any) - score(a.platform as any);
    });

    const mergedTracks: UnifiedTrack[] = [];

    // Simple O(N^2) merge loop - fine for search results (usually < 50 items)
    for (const track of allTracks) {
        // Find existing match in merged list
        const match = mergedTracks.find(t => isSimilar(t, track));

        if (match) {
            // MERGE
            match.sources = { ...match.sources, ...track.sources };
            if (track.isVerified) match.isVerified = true;
            // Keep platform of the primary (first added) track
        } else {
            // NEW ENTRY
            mergedTracks.push(track);
        }
    }

    return mergedTracks;
}
