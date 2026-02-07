'use client';

import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { useAudio } from './AudioProvider';
import { generateSmartDiscoveryQueries } from '@/lib/algorithm';

interface DailyMix {
    id: string;
    title: string;
    description: string;
    gradient: string;
    icon: any;
    query: string;
    seedArtist?: string;
}

const MIX_GRADIENTS = [
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-violet-600 to-fuchsia-600',
];

export function DailyMixes() {
    const { listeningHistory, likedSongs, playTrack, addToQueue } = useAudio();
    const [personalizedMixes, setPersonalizedMixes] = useState<DailyMix[]>([]);
    const [previews, setPreviews] = useState<{ [key: number]: any[] }>({});
    const [loadingMix, setLoadingMix] = useState<number | null>(null);

    useEffect(() => {
        // Generate mixes only on client side to avoid hydration mismatch
        const queries = generateSmartDiscoveryQueries(listeningHistory);

        const mixes: DailyMix[] = queries.map((query, index) => ({
            id: `daily-mix-${index}`,
            title: `Daily Mix ${index + 1}`,
            description: `Based on your recent listening`,
            gradient: MIX_GRADIENTS[index % MIX_GRADIENTS.length],
            icon: Play,
            query: query,
            seedArtist: query.includes('like') ? query.split('like ')[1] : undefined
        }));

        setPersonalizedMixes(mixes);

        // Fetch previews for each mix
        mixes.forEach((mix, index) => {
            fetch(`/api/search?q=${encodeURIComponent(mix.query)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPreviews(prev => ({ ...prev, [index]: data.slice(0, 1) }));
                    }
                })
                .catch(err => console.error('Failed to load preview', err));
        });
    }, [listeningHistory]);

    const handlePlayMix = async (index: number, query: string) => {
        setLoadingMix(index);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const tracks = await res.json();

            if (Array.isArray(tracks) && tracks.length > 0) {
                playTrack(tracks[0]);
                tracks.slice(1).forEach(track => addToQueue(track));
            }
        } catch (error) {
            console.error("Failed to play mix", error);
        } finally {
            setLoadingMix(null);
        }
    };

    if (personalizedMixes.length === 0) return null;

    return (
        <section className="mb-12">
            <div className="mb-6">
                <h2 className="text-3xl font-black text-white tracking-tight">Your Daily Mixes</h2>
                <p className="text-zinc-500 text-sm font-medium mt-1">
                    {likedSongs.length > 0 ? "Curated based on your listening history" : "Tailored soundtracks for every moment"}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {personalizedMixes.map((mix, i) => {
                    const Icon = mix.icon;
                    const isLoading = loadingMix === i;
                    const mixTracks = previews[i] || [];

                    // Fallback to gradient if no track loaded yet
                    const coverImage = mixTracks[0]?.thumbnail;

                    return (
                        <div
                            key={mix.id}
                            onClick={() => handlePlayMix(i, mix.query)}
                            className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] bg-[#0A0A0B] border border-white/5 shadow-xl"
                        >
                            {/* Main Cover Image */}
                            <div className="absolute inset-0 bg-zinc-900">
                                {coverImage ? (
                                    <Image
                                        src={coverImage}
                                        alt={mix.title}
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 group-hover:scale-110"
                                        unoptimized={!coverImage?.includes('i.ytimg.com')}
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
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
                                    {mix.seedArtist && (
                                        <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-bold text-white/80 border border-white/10">
                                            Inspired by {mix.seedArtist}
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
