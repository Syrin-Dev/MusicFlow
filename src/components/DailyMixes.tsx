'use client';

import { Play, TrendingUp, Music, ListMusic, Headset } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';
import { useState, useEffect } from 'react';
import { toUnifiedTrack } from '@/lib/types/music';

// Base definitions for mixes
const BASE_MIXES = [
    {
        id: 'chill',
        title: 'Chill Vibes',
        icon: Music,
        gradient: 'from-violet-600 to-indigo-900',
        baseQuery: 'lofi hip hop instrumental aesthetic',
        keywords: ['chill', 'relax', 'lofi', 'acoustic'],
        timeSlots: ['evening', 'night'] // Preferred times
    },
    {
        id: 'workout',
        title: 'Workout Energy',
        icon: TrendingUp,
        gradient: 'from-rose-600 to-orange-900',
        baseQuery: 'gym phonk high energy workout music',
        keywords: ['workout', 'gym', 'phonk', 'energy'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'focus',
        title: 'Focus Flow',
        icon: Headset,
        gradient: 'from-emerald-500 to-teal-900',
        baseQuery: 'ambient study music no lyrics deep focus',
        keywords: ['focus', 'study', 'ambient', 'piano'],
        timeSlots: ['morning', 'afternoon']
    },
    {
        id: 'party',
        title: 'Party Hits',
        icon: ListMusic,
        gradient: 'from-amber-500 to-pink-900',
        baseQuery: 'summer dance club hits remix 2025',
        keywords: ['party', 'club', 'dance', 'remix'],
        timeSlots: ['evening', 'night']
    }
];

interface DailyMixesProps {
    prefetchedPreviews?: { [key: string]: any[] };
}

export function DailyMixes({ prefetchedPreviews }: DailyMixesProps) {
    const { playPlaylist, likedSongs } = useAudio();
    const [loadingMix, setLoadingMix] = useState<string | null>(null);

    // State to hold the final personalized mix configurations
    const [personalizedMixes, setPersonalizedMixes] = useState<any[]>([]);
    const [hasMounted, setHasMounted] = useState(false);

    // Previews for the UI (Images)
    const [previews, setPreviews] = useState<{ [key: string]: any[] }>(prefetchedPreviews || {});

    useEffect(() => {
        setHasMounted(true);
    }, []);


    useEffect(() => {
        // 1. Determine Time of Day
        const hour = new Date().getHours();
        let timeOfDay = 'morning';
        if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else if (hour >= 22 || hour < 5) timeOfDay = 'night';

        // 2. Sort Mixes based on Time of Day Relevance
        const sortedMixes = [...BASE_MIXES].sort((a, b) => {
            const aScore = a.timeSlots.includes(timeOfDay) ? 1 : 0;
            const bScore = b.timeSlots.includes(timeOfDay) ? 1 : 0;
            return bScore - aScore; // Higher score comes first
        });

        // 3. Personalize Queries using Liked Songs (Smart Seeds)
        const generatePersonalizedMixes = async () => {
            const newMixes = sortedMixes.map(mix => {
                let personalizedQuery = mix.baseQuery;
                let seedArtist = null;

                // Try to find a liked artist that fits the vibe
                // This is a naive heuristic: pick random artist from likes
                if (likedSongs.length > 0) {
                    const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
                    // Just purely seeding with an artist often gives great results for that vibe
                    // e.g. "The Weeknd chill mix" or "The Weeknd party remix"
                    if (Math.random() > 0.3) { // 70% chance to personlize
                        seedArtist = randomLiked.artist;
                        // Construct query: "[Artist] [Vibe Keywords]"
                        // e.g. "Drake workout energy"
                        const vibeKeyword = mix.keywords[Math.floor(Math.random() * mix.keywords.length)];
                        personalizedQuery = `${seedArtist} ${vibeKeyword} mix`;
                    }
                }

                return {
                    ...mix,
                    query: personalizedQuery,
                    seedArtist // Store to show "Inspired by..."
                };
            });

            setPersonalizedMixes(newMixes);

            // 4. Fetch Previews (Thumbnails) IF not provided or if we want personalized ones
            // For now, if we have prefetchedPreviews, we use them to start.
            // But if personalizedQuery differs significantly, we might want to fetch new ones.
            // However, to keep it fast, we can rely on prefetched ones initially.
            // If we don't have prefetched, fetch.

            if (!prefetchedPreviews) {
                newMixes.forEach(async (mix) => {
                    try {
                        const res = await fetch(`/api/search?q=${encodeURIComponent(mix.query)}`);
                        const data = await res.json();
                        // Handle both paginated and array responses
                        const tracks = data.results || (Array.isArray(data) ? data : []);
                        if (tracks.length > 0) {
                            setPreviews(prev => ({ ...prev, [mix.id]: tracks.slice(0, 4) }));
                        }
                    } catch (e) {
                        console.error("Preview failed", e);
                    }
                });
            }
        };

        generatePersonalizedMixes();
    }, [likedSongs.length, prefetchedPreviews]); // Dependency on likedSongs

    const handlePlayMix = async (id: string, query: string) => {
        setLoadingMix(id);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            // Handle both paginated and array responses
            const tracks = data.results || (Array.isArray(data) ? data : []);
            if (tracks.length > 0) {
                const playTracks = tracks.map((t: any) => toUnifiedTrack({
                    id: t.id,
                    title: t.title,
                    artist: t.artist,
                    thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`
                }));
                playPlaylist(playTracks, 0);
            }
        } catch (error) { console.error(error); }
        setLoadingMix(null);
    };

    if (!hasMounted && !prefetchedPreviews) return (
        <div suppressHydrationWarning className="h-64 flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-white/40 animate-spin"></div>
        </div>
    );

    // If we have prefetchedPreviews but not yet mounted/personalized, show sortedMixes (default order or based on server guess?)
    // We can show BASE_MIXES initially if we haven't personalized yet.
    const displayMixes = personalizedMixes.length > 0 ? personalizedMixes : BASE_MIXES;

    return (
        <section suppressHydrationWarning className="py-2">
            <div className="flex flex-col mb-8 px-1">
                <div className="flex items-center gap-2 mb-2">
                    {/* Icon based on time? Optional polish */}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Your Daily Mixes</h2>
                <p className="text-zinc-500 text-sm font-medium mt-1">
                    {likedSongs.length > 0 ? "Curated based on your listening history" : "Tailored soundtracks for every moment"}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {displayMixes.map((mix, i) => {
                    const Icon = mix.icon;
                    const isLoading = loadingMix === mix.id;
                    // Map by ID now
                    const mixTracks = previews[mix.id] || [];

                    // Fallback to gradient if no track loaded yet
                    const coverImage = mixTracks[0]?.thumbnail;

                    return (
                        <div
                            key={mix.id}
                            onClick={() => handlePlayMix(mix.id, (mix as any).query || mix.baseQuery)}
                            className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] bg-[#0A0A0B] border border-white/5 shadow-xl"
                        >
                            {/* Main Cover Image */}
                            <div className="absolute inset-0 bg-zinc-900">
                                {coverImage ? (
                                    <img
                                        src={coverImage}
                                        alt=""
                                        loading="lazy"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            const trackId = mixTracks[0]?.id;
                                            if (trackId && !img.src.includes('mqdefault')) {
                                                img.src = `https://i.ytimg.com/vi/${trackId}/mqdefault.jpg`;
                                            }
                                        }}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${mix.gradient} opacity-20`}></div>
                                )}
                            </div>

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${mix.gradient} mix-blend-color opacity-30 group-hover:opacity-50 transition-opacity duration-700`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
                                        <Icon size={24} className="text-white" />
                                    </div>
                                    {(mix as any).seedArtist && (
                                        <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-bold text-white/80 border border-white/10">
                                            Inspired by {(mix as any).seedArtist}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Daily Mix {i + 1}</p>
                                    <h3 className="text-3xl font-black text-white leading-none tracking-tight line-clamp-2">
                                        {mix.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 z-20">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <Play size={28} fill="black" className="ml-1 text-black" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
