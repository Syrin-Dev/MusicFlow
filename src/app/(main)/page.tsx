import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import { searchMusic } from "@/lib/ytmusic";
import { generateSmartDiscoveryQueries } from "@/lib/algorithm";
import HomeClient from "@/components/HomeClient";

// Re-define BASE_MIXES (or extract to shared file - duplication is safer for now)
const BASE_MIXES = [
    {
        id: 'chill',
        baseQuery: 'lofi hip hop instrumental aesthetic',
        keywords: ['chill', 'relax', 'lofi', 'acoustic'],
        timeSlots: ['evening', 'night']
    },
    {
        id: 'workout',
        baseQuery: 'gym phonk high energy workout music',
        keywords: ['workout', 'gym', 'phonk', 'energy'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'focus',
        baseQuery: 'ambient study music no lyrics deep focus',
        keywords: ['focus', 'study', 'ambient', 'piano'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'party',
        baseQuery: 'summer dance club hits remix 2025',
        keywords: ['party', 'club', 'dance', 'remix'],
        timeSlots: ['evening', 'night']
    }
];

// Helper to determine time of day on server
function getTimeOfDay() {
    // Basic UTC mapping to time of day slots
    // This will be server time (UTC), so might not match user local time perfectly.
    // Acceptable trade-off for SSR speed.
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    if (hour >= 22 || hour < 5) return 'night';
    return 'morning';
}

export const revalidate = 3600; // Revalidate page every hour

export default async function Home() {
    const session = await getServerSession(authOptions);
    let listeningHistory: any[] = [];
    let likedSongs: any[] = [];

    if (session?.user?.email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: {
                    history: { orderBy: { playedAt: 'desc' }, take: 20 },
                    likes: { take: 20 }
                }
            });
            if (user) {
                listeningHistory = user.history.map(h => ({
                    id: h.videoId,
                    title: h.title,
                    artist: h.artist,
                    thumbnail: `https://i.ytimg.com/vi/${h.videoId}/hqdefault.jpg` // Approximation or better if stored
                }));
                likedSongs = user.likes.map(l => ({
                    id: l.videoId,
                    title: l.title,
                    artist: l.artist,
                    thumbnail: `https://i.ytimg.com/vi/${l.videoId}/hqdefault.jpg`
                }));
            }
        } catch (e) {
            console.error("Failed to fetch user data for home", e);
        }
    }

    // Parallel Data Fetching
    const [heroData, dailyMixPreviews, recommendedTracks, quickPicksTracks] = await Promise.all([
        // 1. Hero Data
        (async () => {
            // Default Featured
             const FEATURED_HITS = [
                { id: '34Na4j8AVgA', title: 'Starboy', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/maxresdefault.jpg' },
                { id: '5GJWxDKyk3A', title: 'Happier Than Ever', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/5GJWxDKyk3A/maxresdefault.jpg' },
                { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg' },
            ];

            // Try to pick one from likes/history if available
            // But doing random on server means hydration mismatch if client generates different random.
            // BETTER: Pick one deterministically or just use first.
            // Or pass null and let client hydrate (but that causes layout shift).
            // Let's pick a default featured one to ensure fast LCP.
            // If we have personalized data, maybe pick the most recent history item?
            // "Continue Listening" is valuable.
            if (listeningHistory.length > 0) {
                 const last = listeningHistory[0];
                 // Ensure high res thumbnail
                 return { ...last, thumbnail: `https://i.ytimg.com/vi/${last.id}/maxresdefault.jpg` };
            }
            // Fallback
            return FEATURED_HITS[0]; // Always start with first featured hit for consistency
        })(),

        // 2. Daily Mixes Previews
        (async () => {
             // We need to sort mixes based on time (server time)
             const timeOfDay = getTimeOfDay();
             const sortedMixes = [...BASE_MIXES].sort((a, b) => {
                const aScore = a.timeSlots.includes(timeOfDay) ? 1 : 0;
                const bScore = b.timeSlots.includes(timeOfDay) ? 1 : 0;
                return bScore - aScore;
             });

             // We fetch previews for ALL of them or just top 4?
             // Fetch all 4.
             // Also, personalization: we can try to seed with a liked artist if available.
             // Picking a random liked artist on server is tricky for consistency, but works if we just do it once.

             const previews: { [key: string]: any[] } = {};

             // Create queries
             const mixPromises = sortedMixes.map(async (mix, index) => {
                 let query = mix.baseQuery;
                 // Simple personalization
                 if (likedSongs.length > 0) {
                     // Pick artist based on index mod length to be deterministic-ish
                     const artist = likedSongs[index % likedSongs.length].artist;
                     // Only sometimes?
                     if (index % 2 === 0) {
                         const keyword = mix.keywords[index % mix.keywords.length];
                         query = `${artist} ${keyword} mix`;
                     }
                 }

                 const results = await searchMusic(query);
                 return { id: mix.id, tracks: results.slice(0, 4) };
             });

             const results = await Promise.all(mixPromises);
             results.forEach(r => {
                 previews[r.id] = r.tracks;
             });
             return previews;
        })(),

        // 3. Recommended Grid
        (async () => {
             const queries = generateSmartDiscoveryQueries(listeningHistory);
             const query = queries[0] || 'trending music 2024';
             const results = await searchMusic(query);
             return results.slice(0, 5);
        })(),

        // 4. Quick Picks
        (async () => {
             const QUICK_PICK_QUERIES = [
                'best songs all time',
                'viral music 2024',
                'feel good music',
                'chill study music',
                'party music hits',
                'love songs 2024',
            ];
            let queries = QUICK_PICK_QUERIES;
             if (listeningHistory.length > 0) {
                const artists = listeningHistory.slice(0, 3).map(t => t.artist);
                queries = [...artists, ...QUICK_PICK_QUERIES];
            }

            // Pick 2 queries
            const q1 = queries[0];
            const q2 = queries[1] || queries[0];

            const [r1, r2] = await Promise.all([
                searchMusic(q1),
                searchMusic(q2)
            ]);

            // Combine and unique
            const combined = [...r1.slice(0, 8), ...r2.slice(0, 8)];
            // Simple unique by ID
            const seen = new Set();
            return combined.filter(item => {
                const duplicate = seen.has(item.id);
                seen.add(item.id);
                return !duplicate;
            }).slice(0, 16);
        })()
    ]);

    return (
        <HomeClient
            heroData={heroData}
            dailyMixPreviews={dailyMixPreviews}
            recommendedTracks={recommendedTracks}
            quickPicksTracks={quickPicksTracks}
        />
    );
}
