'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';
import { AddToPlaylist } from './AddToPlaylist';
import Image from 'next/image';
import { toUnifiedTrack } from '@/lib/types/music';

interface HeroProps {
    initialTrack?: any;
}

export function Hero({ initialTrack }: HeroProps) {
    const { playTrack, currentTrack, isLiked, toggleLike, isPlaying, togglePlay, likedSongs, listeningHistory } = useAudio();
    const [displayTrack, setDisplayTrack] = useState<any>(initialTrack || null);
    const [context, setContext] = useState(initialTrack ? 'Featured Hit' : '');

    // Some curated fallback hits
    const FEATURED_HITS = [
        { id: '34Na4j8AVgA', title: 'Starboy', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/maxresdefault.jpg' },
        { id: '5GJWxDKyk3A', title: 'Happier Than Ever', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/5GJWxDKyk3A/maxresdefault.jpg' },
        { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg' },
    ];

    useEffect(() => {
        if (currentTrack) {
            setDisplayTrack(currentTrack);
            setContext('Now Playing');
            return;
        }

        // Logic: Liked > History > Featured (if initialTrack not provided or overriden by better context)
        // If initialTrack is provided, we start with it.
        // But if user has history/likes, maybe we should switch?
        // To avoid layout shift, let's only switch if we didn't have an initial track, OR if we want to be personalized.
        // User asked for instant load. Initial track is best.
        // But personalization is key.
        // Let's stick with initialTrack if provided, unless currentTrack changes.

        if (!initialTrack) {
             if (likedSongs.length > 0) {
                const random = likedSongs[Math.floor(Math.random() * likedSongs.length)];
                setDisplayTrack(random);
                setContext('From your favorites');
            } else if (listeningHistory.length > 0) {
                const random = listeningHistory[Math.floor(Math.random() * listeningHistory.length)];
                setDisplayTrack(random);
                setContext('Continue Listening');
            } else {
                const random = FEATURED_HITS[Math.floor(Math.random() * FEATURED_HITS.length)];
                setDisplayTrack(random);
                setContext('Global Featured');
            }
        }
    }, [currentTrack, likedSongs.length, listeningHistory.length, initialTrack]);

    if (!displayTrack) return null;

    const isPlayingHero = currentTrack?.id === displayTrack.id;
    const liked = isLiked(displayTrack.id);

    return (
        <div className="relative w-full h-[400px] md:h-[450px] rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl group border border-white/5 mx-auto max-w-7xl mt-4 md:mt-8">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 transition-transform duration-1000 transform group-hover:scale-105">
                 <Image
                    src={displayTrack.thumbnail}
                    alt={displayTrack.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                    priority
                    quality={75}
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[10px] group-hover:backdrop-blur-sm transition-all duration-700"></div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 md:p-16 md:pb-24 flex flex-col justify-end z-10">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 w-fit">
                        <span className={`w-2 h-2 rounded-full ${isPlayingHero && isPlaying ? 'bg-[#8B5CF6] animate-pulse shadow-[0_0_10px_#8B5CF6]' : 'bg-white/40'}`}></span>
                        <span className="text-[10px] font-black text-white/90 tracking-[0.2em] uppercase">
                            {context}
                        </span>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6 max-w-3xl">
                    <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white leading-tight md:leading-[1.1] tracking-tighter drop-shadow-2xl line-clamp-2">
                        {displayTrack.title}
                    </h1>
                    <p className="text-lg md:text-2xl text-white/60 font-semibold drop-shadow-lg truncate">
                        {displayTrack.artist}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-8 md:pt-12">
                    {/* Redesigned Resume Button */}
                    <button
                        onClick={() => isPlayingHero ? togglePlay() : playTrack(toUnifiedTrack(displayTrack))}
                        className="flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-white rounded-full font-black text-lg md:text-xl hover:bg-[#8B5CF6]/40 hover:border-[#8B5CF6] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] backdrop-blur-md group-btn"
                    >
                        {isPlayingHero && isPlaying ?
                            <Pause size={28} fill="currentColor" className="text-white drop-shadow-md" /> :
                            <Play size={28} fill="currentColor" className="text-white drop-shadow-md ml-1" />
                        }
                        {isPlayingHero ? (isPlaying ? 'PAUSE' : 'RESUME') : 'PLAY'}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleLike(displayTrack)}
                            className={`p-5 rounded-full backdrop-blur-xl border transition-all duration-500 group/btn active:scale-90 ${liked
                                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.3)] text-[#8B5CF6]'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                }`}
                            title={liked ? "Unlike" : "Like"}
                        >
                            <Heart
                                size={24}
                                className={`transition-all duration-500 ${liked ? 'fill-[#8B5CF6] scale-110' : 'group-hover/btn:scale-110'}`}
                            />
                        </button>

                        <AddToPlaylist
                            track={toUnifiedTrack(displayTrack)}
                            dropdownPosition="bottom"
                            className="p-5 rounded-full backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                        >
                            <span className="material-icons-round text-2xl">playlist_add</span>
                        </AddToPlaylist>
                    </div>
                </div>
            </div>

            {/* Side Artwork Preview (Glassmorphism) */}
            <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-80 h-80 rounded-[3rem] overflow-hidden border border-white/10 hidden xl:block shadow-2xl rotate-6 group-hover:rotate-3 transition-transform duration-1000">
                <Image
                    src={displayTrack.thumbnail}
                    alt={displayTrack.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1200px) 0vw, 400px" // Hidden on small screens
                    quality={75}
                />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
                {/* Glow behind the artwork */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* Decorative Glow */}
            <div className={`absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${liked ? 'bg-[#8B5CF6]/30' : 'bg-white/5'}`}></div>
        </div>
    );
}
