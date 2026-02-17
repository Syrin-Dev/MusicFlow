'use client';

import { Play, TrendingUp, Music, ListMusic, Headset } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';
import { useState, memo } from 'react';
import Image from 'next/image';

const ICON_MAP: Record<string, any> = {
    'Music': Music,
    'TrendingUp': TrendingUp,
    'ListMusic': ListMusic,
    'Headset': Headset
};

interface DailyMix {
    id: string;
    title: string;
    iconName: string;
    gradient: string;
    query: string;
    seedArtist?: string | null;
    coverImage?: string;
}

interface DailyMixesClientProps {
    mixes: DailyMix[];
}

const DailyMixItem = memo(({ mix, index, isLoading, onClick }: { mix: DailyMix, index: number, isLoading: boolean, onClick: () => void }) => {
    const Icon = ICON_MAP[mix.iconName] || Music;
    const coverImage = mix.coverImage;

    return (
        <div
            onClick={onClick}
            className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] bg-[#0A0A0B] border border-white/5 shadow-xl"
        >
            {/* Main Cover Image */}
            <div className="absolute inset-0 bg-zinc-900">
                {coverImage ? (
                    <Image
                        src={coverImage}
                        alt={mix.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        className="object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 group-hover:scale-110"
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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Daily Mix {index + 1}</p>
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
});

DailyMixItem.displayName = 'DailyMixItem';

export function DailyMixesClient({ mixes }: DailyMixesClientProps) {
    const { playPlaylist, likedSongs } = useAudio();
    const [loadingMix, setLoadingMix] = useState<number | null>(null);

    const handlePlayMix = async (index: number, query: string) => {
        setLoadingMix(index);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const tracks = await res.json();
            if (Array.isArray(tracks) && tracks.length > 0) {
                const playTracks = tracks.map((t: any) => ({
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

    if (!mixes || mixes.length === 0) return null;

    return (
        <section className="py-2">
            <div className="flex flex-col mb-8 px-1">
                <h2 className="text-3xl font-black text-white tracking-tight">Your Daily Mixes</h2>
                <p className="text-zinc-500 text-sm font-medium mt-1">
                    {likedSongs.length > 0 ? "Curated based on your listening history" : "Tailored soundtracks for every moment"}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mixes.map((mix, i) => (
                    <DailyMixItem
                        key={mix.id}
                        mix={mix}
                        index={i}
                        isLoading={loadingMix === i}
                        onClick={() => handlePlayMix(i, mix.query)}
                    />
                ))}
            </div>
        </section>
    );
}
