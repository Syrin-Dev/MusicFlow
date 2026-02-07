import { prisma } from '@/lib/prismadb';
import { searchMusic } from '@/lib/ytmusic';

export interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
}

export interface ScoredTrack extends Track {
    score: number;
    reason: string;
}

export async function getRecommendations(userId: string | null, context: string, limit: number = 20) {
    // Fetch user data (likes/history) in parallel if logged in
    const userDataPromise = userId ? fetchUserData(userId) : Promise.resolve(null);

    // Phase 1: Candidate Generation (Retrieval)
    const candidates = await generateCandidates(userId, context, limit * 3, userDataPromise);

    // Phase 2: Ranking (Scoring)
    const rankedTracks = await rankCandidates(candidates, userId, context, userDataPromise);

    // Phase 3: Re-ranking (Diversity & Policy)
    const finalRecommendations = applyDiversityConstraints(rankedTracks, limit);

    return {
        recommendations: finalRecommendations,
        personalized: !!userId,
        context
    };
}

async function fetchUserData(userId: string) {
    const [likedSongs, recentListening] = await Promise.all([
        prisma.likedSong.findMany({
            where: { userId },
            include: { track: true },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50 likes for performance
        }),
        prisma.listeningEvent.findMany({
            where: {
                userId,
                startedAt: { gte: new Date(Date.now() - 3600000) } // Last hour
            },
            select: { videoId: true }
        })
    ]);
    return { likedSongs, recentListening };
}

// Phase 1: Candidate Generation
async function generateCandidates(
    userId: string | null,
    context: string,
    count: number,
    userDataPromise: Promise<{ likedSongs: any[], recentListening: any[] } | null>
): Promise<Track[]> {
    const candidates: Track[] = [];
    const seenIds = new Set<string>();
    const searchPromises: Promise<any>[] = [];

    // Helper to safely search without rejecting Promise.all
    const safeSearch = (query: string, source: string) =>
        searchMusic(query)
            .then(res => ({ source, data: res }))
            .catch(e => { console.warn(`Failed search for ${query}`, e); return { source, data: [] }; });

    // Strategy 1: Context-based queries (Start Immediately)
    const contextQueries: Record<string, string[]> = {
        home: ['popular music 2024', 'trending songs', 'top hits'],
        workout: ['workout music', 'gym motivation', 'high energy beats'],
        chill: ['chill vibes', 'relaxing music', 'lo-fi beats'],
        focus: ['focus music', 'study beats', 'concentration music'],
        party: ['party music', 'dance hits', 'club bangers']
    };

    const queries = contextQueries[context] || contextQueries.home;
    queries.forEach(query => {
        searchPromises.push(safeSearch(query, 'context'));
    });

    // Strategy 2: User-based queries (Wait for DB)
    if (userId) {
        const userData = await userDataPromise;
        if (userData && userData.likedSongs.length > 0) {
            const topArtists = [...new Set(userData.likedSongs.map(s => s.track?.artist || '').filter(Boolean))].slice(0, 5);

            topArtists.forEach(artistName => {
                searchPromises.push(safeSearch(`${artistName} songs`, 'artist'));
            });

            // Mix strategy
            topArtists.slice(0, 3).forEach(artist => {
                searchPromises.push(safeSearch(`${artist} mix`, 'mix'));
            });
        }
    }

    // Await all parallel searches
    const results = await Promise.all(searchPromises);

    // Process results
    results.forEach(result => {
        if (result && Array.isArray(result.data)) {
            result.data.forEach((track: any) => {
                 const mappedTrack: Track = {
                    id: track.id || track.videoId,
                    title: track.title || track.name,
                    artist: track.artist?.name || track.artist || 'Unknown',
                    thumbnail: track.thumbnail?.url || track.thumbnail
                };

                if (!mappedTrack.id || !mappedTrack.title || mappedTrack.title === 'Unknown') return;

                if (!seenIds.has(mappedTrack.id)) {
                    seenIds.add(mappedTrack.id);
                    candidates.push(mappedTrack);
                }
            });
        }
    });

    return candidates.slice(0, count);
}

// Phase 2: Ranking
async function rankCandidates(
    candidates: Track[],
    userId: string | null,
    context: string,
    userDataPromise: Promise<{ likedSongs: any[], recentListening: any[] } | null>
): Promise<ScoredTrack[]> {
    const scoredTracks: ScoredTrack[] = [];

    let userAffinities: Map<string, number> = new Map();
    let likedVideoIds: Set<string> = new Set();
    let recentlyPlayedIds: Set<string> = new Set();

    if (userId) {
        const userData = await userDataPromise;
        if (userData) {
            userData.likedSongs.forEach(l => {
                likedVideoIds.add(l.videoId);
                if (l.track?.artist) {
                    const artist = l.track.artist.toLowerCase();
                    userAffinities.set(artist, (userAffinities.get(artist) || 0) + 1);
                }
            });
            userData.recentListening.forEach(r => recentlyPlayedIds.add(r.videoId));
        }
    }

    // Context weights
    const contextWeights: Record<string, { energy: number; familiarity: number }> = {
        home: { energy: 0.5, familiarity: 0.6 },
        workout: { energy: 0.9, familiarity: 0.4 },
        chill: { energy: 0.2, familiarity: 0.7 },
        focus: { energy: 0.3, familiarity: 0.5 },
        party: { energy: 0.8, familiarity: 0.3 }
    };
    const weights = contextWeights[context] || contextWeights.home;

    for (const track of candidates) {
        let score = 5.0; // Base score
        let reason = 'Recommended for you';

        // Artist affinity boost
        const artistAffinity = userAffinities.get(track.artist.toLowerCase()) || 0;
        if (artistAffinity > 0) {
            score += artistAffinity * weights.familiarity;
            reason = `Based on your love for ${track.artist}`;
        }

        // Liked song boost
        if (likedVideoIds.has(track.id)) {
            score += 2;
            reason = 'One of your favorites';
        }

        // Recently played penalty
        if (recentlyPlayedIds.has(track.id)) {
            score -= 3;
        }

        // Random exploration factor
        if (Math.random() < 0.1) {
            score += Math.random() * 2;
            if (artistAffinity === 0) {
                reason = 'Something new to discover';
            }
        }

        // Time-of-day adjustment
        const hour = new Date().getHours();
        const isEvening = hour >= 18 || hour < 6;
        if (isEvening && context === 'home') {
            score += artistAffinity > 0 ? 1 : -0.5;
        }

        scoredTracks.push({
            ...track,
            score: Math.max(0, score),
            reason
        });
    }

    // Sort by score descending
    scoredTracks.sort((a, b) => b.score - a.score);

    return scoredTracks;
}

// Phase 3: Apply diversity constraints
function applyDiversityConstraints(
    rankedTracks: ScoredTrack[],
    limit: number
): ScoredTrack[] {
    const result: ScoredTrack[] = [];
    const artistCounts: Map<string, number> = new Map();
    const MAX_PER_ARTIST = 3;

    for (const track of rankedTracks) {
        if (result.length >= limit) break;

        const artistLower = track.artist.toLowerCase();
        const currentCount = artistCounts.get(artistLower) || 0;

        if (currentCount < MAX_PER_ARTIST) {
            result.push(track);
            artistCounts.set(artistLower, currentCount + 1);
        }
    }

    return result;
}
