import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchMusic } from '@/lib/ytmusic';

// Helper to get user email with dev fallback
async function getUserEmail() {
    const session = await getServerSession(authOptions);
    let email = session?.user?.email;

    if (!email && process.env.NODE_ENV !== 'production') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser?.email) {
            email = firstUser.email;
        }
    }
    return email;
}

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    duration?: string;
}

interface ScoredTrack extends Track {
    score: number;
    reason: string;
}

// Main recommendation endpoint
export async function GET(request: NextRequest) {
    try {
        const email = await getUserEmail();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const context = searchParams.get('context') || 'home'; // home, workout, chill, etc.

        let userId: string | null = null;

        if (email) {
            const user = await prisma.user.findUnique({ where: { email } });
            userId = user?.id || null;
        }

        // Phase 1: Candidate Generation (Retrieval)
        const candidates = await generateCandidates(userId, context, limit * 3);

        // Phase 2: Ranking (Scoring)
        const rankedTracks = await rankCandidates(candidates, userId, context);

        // Phase 3: Re-ranking (Diversity & Policy)
        const finalRecommendations = applyDiversityConstraints(rankedTracks, limit);

        return NextResponse.json({
            recommendations: finalRecommendations,
            personalized: !!userId,
            context
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
    }
}

// Phase 1: Candidate Generation
// Retrieves a broad set of potentially relevant tracks
// Phase 1: Candidate Generation
// Retrieves a broad set of potentially relevant tracks
async function generateCandidates(
    userId: string | null,
    context: string,
    count: number
): Promise<Track[]> {
    const candidates: Track[] = [];
    const seenIds = new Set<string>();
    const searchPromises: Promise<any>[] = [];

    // Helper to add unique tracks
    const addTracks = (tracks: any[]) => {
        if (Array.isArray(tracks)) {
            tracks.forEach((track: any) => {
                // Map search result to Track interface
                const mappedTrack: Track = {
                    id: track.id || track.videoId,
                    title: track.title || track.name,
                    artist: track.artist?.name || track.artist || 'Unknown',
                    thumbnail: track.thumbnail?.url || track.thumbnail
                };

                // Basic validation
                if (!mappedTrack.id || !mappedTrack.title || mappedTrack.title === 'Unknown') return;

                if (!seenIds.has(mappedTrack.id)) {
                    seenIds.add(mappedTrack.id);
                    candidates.push(mappedTrack);
                }
            });
        }
    };

    // Strategy 1: User's liked artists
    if (userId) {
        const likedSongs = await prisma.likedSong.findMany({
            where: { userId },
            include: { track: true },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const topArtists = [...new Set(likedSongs.map(s => s.track?.artist || '').filter(Boolean))].slice(0, 5);

        // Queue artist searches
        topArtists.forEach(artistName => {
            searchPromises.push(
                searchMusic(artistName + ' songs')
                    .then(res => ({ source: 'artist', data: res }))
                    .catch(e => { console.warn(`Failed search for ${artistName}`, e); return []; })
            );
        });
    }

    // Strategy 2: Context-based queries
    const contextQueries: Record<string, string[]> = {
        home: ['popular music 2024', 'trending songs', 'top hits'],
        workout: ['workout music', 'gym motivation', 'high energy beats'],
        chill: ['chill vibes', 'relaxing music', 'lo-fi beats'],
        focus: ['focus music', 'study beats', 'concentration music'],
        party: ['party music', 'dance hits', 'club bangers']
    };

    const queries = contextQueries[context] || contextQueries.home;
    queries.forEach(query => {
        searchPromises.push(
            searchMusic(query)
                .then(res => ({ source: 'context', data: res }))
                .catch(e => { console.warn(`Failed search for ${query}`, e); return []; })
        );
    });

    // Strategy 3: Liked songs mix (if logged in)
    if (userId) {
        // Re-fetch liked songs if needed, but we likely caught them in Strategy 1's query or can reuse.
        // To stay consistent with original logic but optimized:
        // We already fetched likedSongs for artists. Let's assume we want a mix for the top 3 artists again?
        // Original logic fetched likedSongs AGAIN. Let's reuse if we had them, but for brevity/optimization,
        // let's just use the topArtists we already found.
        // Actually, let's keep it simple and safe: just skip duplicate logic if we covered it.
        // But the original had "artist + mix". Let's add those queries too.

        const likedSongs = await prisma.likedSong.findMany({
            where: { userId },
            include: { track: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const likedArtists = [...new Set(likedSongs.map(s => s.track?.artist || '').filter(Boolean))];

        likedArtists.slice(0, 3).forEach(artist => {
            searchPromises.push(
                searchMusic(artist + ' mix')
                    .then(res => ({ source: 'mix', data: res }))
                    .catch(e => { console.warn(`Failed mix search for ${artist}`, e); return []; })
            );
        });
    }

    // Await all parallel searches
    const results = await Promise.allSettled(searchPromises);

    // Process results
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            // result.value might be the array directly or wrapped object if we returned that
            // The .then() above wraps it.
            const data = (result.value as any).data || result.value;
            addTracks(data); // Add valid tracks
        }
    });

    return candidates.slice(0, count);
}

// Phase 2: Ranking with multi-objective scoring
async function rankCandidates(
    candidates: Track[],
    userId: string | null,
    context: string
): Promise<ScoredTrack[]> {
    const scoredTracks: ScoredTrack[] = [];

    // Get user affinities if logged in
    let userAffinities: Map<string, number> = new Map();
    let likedVideoIds: Set<string> = new Set();
    let recentlyPlayedIds: Set<string> = new Set();

    if (userId) {
        // Load liked artists as a proxy for affinity
        const liked = await prisma.likedSong.findMany({
            where: { userId },
            include: { track: true }
        });

        liked.forEach(l => {
            likedVideoIds.add(l.videoId);
            if (l.track?.artist) {
                const artist = l.track.artist.toLowerCase();
                userAffinities.set(artist, (userAffinities.get(artist) || 0) + 1);
            }
        });

        // Load recently played (to potentially demote for freshness)
        const recent = await prisma.listeningEvent.findMany({
            where: {
                userId,
                startedAt: { gte: new Date(Date.now() - 3600000) } // Last hour
            },
            select: { videoId: true }
        });
        recent.forEach(r => recentlyPlayedIds.add(r.videoId));
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

        // Liked song boost (but not too much - we want discovery)
        if (likedVideoIds.has(track.id)) {
            score += 2;
            reason = 'One of your favorites';
        }

        // Recently played penalty (freshness)
        if (recentlyPlayedIds.has(track.id)) {
            score -= 3;
        }

        // Random exploration factor (10% boost for discovery)
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
            // Evening: boost chill/familiar content
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
    const MAX_PER_ARTIST = 3; // Diversity: max 3 tracks per artist

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


