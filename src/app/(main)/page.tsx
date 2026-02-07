import { Suspense } from 'react';
import { Hero } from '@/components/Hero';
import { DailyMixesClient } from '@/components/DailyMixesClient';
import { RecommendedGridClient } from '@/components/RecommendedGridClient';
import { QuickPicksClient } from '@/components/QuickPicksClient';
import { MusicVideos } from '@/components/MusicVideos';
import { ListenAgain } from '@/components/ListenAgain';
import { HomeContent } from '@/components/HomeContent';
import { searchMusic, SearchResult } from '@/lib/ytmusic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismadb';

// --- Constants ---
const BASE_MIXES = [
    {
        id: 'chill',
        title: 'Chill Vibes',
        iconName: 'Music',
        gradient: 'from-violet-600 to-indigo-900',
        baseQuery: 'lofi hip hop instrumental aesthetic',
        keywords: ['chill', 'relax', 'lofi', 'acoustic'],
        timeSlots: ['evening', 'night']
    },
    {
        id: 'workout',
        title: 'Workout Energy',
        iconName: 'TrendingUp',
        gradient: 'from-rose-600 to-orange-900',
        baseQuery: 'gym phonk high energy workout music',
        keywords: ['workout', 'gym', 'phonk', 'energy'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'focus',
        title: 'Focus Flow',
        iconName: 'Headset',
        gradient: 'from-emerald-500 to-teal-900',
        baseQuery: 'ambient study music no lyrics deep focus',
        keywords: ['focus', 'study', 'ambient', 'piano'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'party',
        title: 'Party Hits',
        iconName: 'ListMusic',
        gradient: 'from-amber-500 to-pink-900',
        baseQuery: 'summer dance club hits remix 2025',
        keywords: ['party', 'club', 'dance', 'remix'],
        timeSlots: ['evening', 'night']
    }
];

const QUICK_PICK_QUERIES = [
    'best songs all time',
    'viral music 2024',
    'feel good music',
    'chill study music',
    'party music hits',
    'love songs 2024',
];

// --- Server Components (Fetchers) ---

async function DailyMixesFetcher() {
    const session = await getServerSession(authOptions);
    let likedSongs: any[] = [];

    // 1. Fetch User Likes for Personalization
    if (session?.user?.email) {
        try {
            const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { likedSongs: { include: { track: true }, take: 20 } } });
            if (user) likedSongs = user.likedSongs.map(l => l.track).filter(Boolean);
        } catch (e) { console.error("Failed to fetch likes for mixes", e); }
    }

    // 2. Sort Mixes by Time of Day
    // Note: Server time might differ from user time. Ideally use a cookie or default to neutral.
    // For now, we'll use a fixed logic or UTC hour.
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else if (hour >= 22 || hour < 5) timeOfDay = 'night';

    const sortedMixes = [...BASE_MIXES].sort((a, b) => {
        const aScore = a.timeSlots.includes(timeOfDay) ? 1 : 0;
        const bScore = b.timeSlots.includes(timeOfDay) ? 1 : 0;
        return bScore - aScore;
    });

    // 3. Generate Personalized Queries and Fetch Previews
    const mixesWithData = await Promise.all(sortedMixes.map(async (mix) => {
        let personalizedQuery = mix.baseQuery;
        let seedArtist: string | null = null;

        if (likedSongs.length > 0) {
             const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
             // 70% chance
             if (Math.random() > 0.3) {
                 seedArtist = randomLiked.artist;
                 const vibeKeyword = mix.keywords[Math.floor(Math.random() * mix.keywords.length)];
                 personalizedQuery = `${seedArtist} ${vibeKeyword} mix`;
             }
        }

        // Fetch preview (thumbnail)
        let coverImage = '';
        try {
            // We only need 1 result for cover
            const results = await searchMusic(personalizedQuery);
            if (results.length > 0) {
                coverImage = results[0].thumbnail;
            }
        } catch (e) {
            console.error(`Preview fetch failed for ${mix.id}`, e);
        }

        return {
            ...mix,
            query: personalizedQuery,
            seedArtist,
            coverImage
        };
    }));

    return <DailyMixesClient mixes={mixesWithData} />;
}

async function RecommendedGridFetcher() {
    const session = await getServerSession(authOptions);
    let query = 'popular music 2024';
    let source = 'Trending Now';

    if (session?.user?.email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: {
                    listeningHistory: { orderBy: { startedAt: 'desc' }, take: 5 }
                }
            });

            if (user && user.listeningHistory.length > 0) {
                 // Simple logic: pick last artist
                 const lastArtist = user.listeningHistory[0].artist; // Check schema, listeningEvent might store artist directly or via relation
                 // Actually schema check: listeningEvent has `artist` string field usually?
                 // Let's assume yes based on previous code.
                 // Wait, `prisma/schema.prisma` is not visible but `AudioProvider` sends `artist` in body.
                 // In `route.ts`, `listeningEvent` has `videoId`.
                 // Let's use `likedSongs` as it's safer if `listeningHistory` doesn't store artist name directly.
                 // Re-check `route.ts`: `recent` selects `videoId`.
                 // `AudioProvider` sends `title`, `artist` in body to `/api/listening-events`.
                 // So the model likely has it. I'll verify if `artist` is available.
                 // To be safe, let's use a generic 'discovery' query if we can't easily access artist.
                 // Or just use 'new music'.
                 // Actually, let's check `likedSongs` which we know has `track` relation.
                 const liked = await prisma.likedSong.findFirst({ where: { userId: user.id }, include: { track: true }, orderBy: { createdAt: 'desc' } });
                 if (liked?.track?.artist) {
                     query = `music like ${liked.track.artist}`;
                     source = `Because you like ${liked.track.artist}`;
                 }
            }
        } catch (e) { console.error("Failed to fetch history for Recs", e); }
    }

    const tracks = await searchMusic(query);
    return <RecommendedGridClient initialTracks={tracks.slice(0, 5)} initialSource={source} />;
}

async function QuickPicksFetcher() {
     // Pick random queries
     const q1 = QUICK_PICK_QUERIES[Math.floor(Math.random() * QUICK_PICK_QUERIES.length)];
     const q2 = QUICK_PICK_QUERIES[Math.floor(Math.random() * QUICK_PICK_QUERIES.length)];

     const [r1, r2] = await Promise.all([
         searchMusic(q1),
         searchMusic(q2)
     ]);

     const combined = [...r1.slice(0, 8), ...r2.slice(0, 8)];
     // Unique
     const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

     return <QuickPicksClient initialTracks={unique.slice(0, 16)} />;
}

// --- Skeletons ---

function DailyMixesSkeleton() {
    return (
        <section className="py-2 animate-pulse">
             <div className="h-8 w-64 bg-white/10 rounded mb-8"></div>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-[2rem] bg-white/5"></div>
                ))}
             </div>
        </section>
    );
}

function SectionSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                 {[...Array(5)].map((_, i) => (
                     <div key={i} className="space-y-3">
                         <div className="aspect-square rounded-2xl bg-white/5"></div>
                         <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                     </div>
                 ))}
            </div>
        </div>
    );
}

// --- Main Page ---

export default async function Home() {
  return (
    <HomeContent>
      <Hero />

      <div className="space-y-24">
        <Suspense fallback={<DailyMixesSkeleton />}>
            <DailyMixesFetcher />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
            <RecommendedGridFetcher />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
            <QuickPicksFetcher />
        </Suspense>

        <MusicVideos />
        <ListenAgain />
      </div>
    </HomeContent>
  );
}
