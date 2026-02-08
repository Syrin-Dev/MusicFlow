import { MusicSource, UnifiedTrack } from './types/music';
import { PipedSource } from './sources/piped';
import { SoundCloudSource } from './sources/soundcloud';
import { AudiusSource } from './sources/audius';
import { searchMusic } from './ytmusic';

// Singleton instances to reuse connections
const pipedSource = new PipedSource();
const soundcloudSource = new SoundCloudSource();
const audiusSource = new AudiusSource();

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
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

// Clean title/artist for comparison
function cleanString(str: string): string {
    return str
        .toLowerCase()
        .replace(/\(official.*?\)/gi, '')
        .replace(/\[official.*?\]/gi, '')
        .replace(/official\s*(video|audio|music\s*video)/gi, '')
        .replace(/\(lyrics.*?\)/gi, '')
        .replace(/\(.*?remix.*?\)/gi, '')
        .replace(/ft\.?|feat\.?|featuring/gi, '')
        .replace(/prod\.?/gi, '')
        .replace(/\bhd\b|\bhq\b|\b4k\b|\bremaster(ed)?\b/gi, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Check if two tracks are similar enough to merge
function areSimilar(a: UnifiedTrack, b: UnifiedTrack): boolean {
    const titleA = cleanString(a.title);
    const titleB = cleanString(b.title);
    const artistA = cleanString(a.artist);
    const artistB = cleanString(b.artist);

    // Artist similarity (must be >= 70%)
    const artistMax = Math.max(artistA.length, artistB.length);
    if (artistMax > 0) {
        const artistSimilarity = 1 - (levenshtein(artistA, artistB) / artistMax);
        if (artistSimilarity < 0.7) return false;
    }

    // Title similarity (must be >= 80%)
    const titleMax = Math.max(titleA.length, titleB.length);
    if (titleMax > 0) {
        const titleSimilarity = 1 - (levenshtein(titleA, titleB) / titleMax);
        return titleSimilarity >= 0.8;
    }

    return false;
}

// Convert ytmusic SearchResult to UnifiedTrack
function toUnifiedFromYTMusic(track: any): UnifiedTrack {
    return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
        duration: 0,
        isVerified: false,
        platform: 'youtube',
        sources: { youtubeId: track.id }
    };
}

export async function searchUnified(query: string): Promise<UnifiedTrack[]> {
    // Parallel fetch from all sources with individual timeouts
    const [pipedResult, scResult, audiusResult] = await Promise.allSettled([
        pipedSource.search(query),
        soundcloudSource.search(query),
        audiusSource.search(query)
    ]);

    const allTracks: UnifiedTrack[] = [];

    // Collect successful results
    if (pipedResult.status === 'fulfilled') {
        allTracks.push(...pipedResult.value);
    }
    if (scResult.status === 'fulfilled') {
        allTracks.push(...scResult.value);
    }
    if (audiusResult.status === 'fulfilled') {
        allTracks.push(...audiusResult.value);
    }

    // CRITICAL: If multi-source returned nothing, fallback to ytmusic (direct API)
    if (allTracks.length === 0) {
        console.warn('All multi-source APIs failed, falling back to ytmusic');
        try {
            const ytResults = await searchMusic(query);
            return ytResults.slice(0, 20).map(toUnifiedFromYTMusic);
        } catch (e) {
            console.error('YTMusic fallback also failed:', e);
            return [];
        }
    }

    // Sort by quality: Verified > YouTube > SoundCloud > Audius
    allTracks.sort((a, b) => {
        // Verified artists first
        if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1;

        // Then by platform priority
        const platformScore = (p: string) => {
            if (p === 'youtube') return 3;
            if (p === 'soundcloud') return 2;
            return 1;
        };
        return platformScore(b.platform) - platformScore(a.platform);
    });

    // Merge duplicates
    const merged: UnifiedTrack[] = [];

    for (const track of allTracks) {
        const existing = merged.find(t => areSimilar(t, track));

        if (existing) {
            // Merge sources from duplicate
            existing.sources = { ...existing.sources, ...track.sources };
            // Upgrade to verified if duplicate is verified
            if (track.isVerified) existing.isVerified = true;
            // Keep better thumbnail
            if (!existing.thumbnail && track.thumbnail) {
                existing.thumbnail = track.thumbnail;
            }
        } else {
            merged.push({ ...track });
        }
    }

    return merged;
}

// Export sources for testing
export { pipedSource, soundcloudSource, audiusSource };
