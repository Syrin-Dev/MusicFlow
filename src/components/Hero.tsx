'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

export function Hero() {
    const { playTrack, currentTrack, isLiked, toggleLike, isPlaying, togglePlay, likedSongs, listeningHistory } = useAudio();
    const [displayTrack, setDisplayTrack] = useState<any>(null);
    const [context, setContext] = useState('Featured Hit');

    // Some curated fallback hits
    const FEATURED_HITS = [
        { id: '1-xGerv5FOk', title: 'Starboy', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/1-xGerv5FOk/maxresdefault.jpg' },
        { id: 'm7Bc3pLyij0', title: 'Happier Than Ever', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/m7Bc3pLyij0/maxresdefault.jpg' },
        { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg' },
    ];

    useEffect(() => {
        if (currentTrack) {
            setDisplayTrack(currentTrack);
            setContext('Now Playing');
            return;
        }

        // Logic: Liked > History > Featured
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
    }, [currentTrack, likedSongs.length, listeningHistory.length]);

    if (!displayTrack) return null;

    const isPlayingHero = currentTrack?.id === displayTrack.id;
    const liked = isLiked(displayTrack.id);

    return (
        <div className="relative w-full h-[450px] rounded-[3rem] overflow-hidden shadow-2xl group border border-white/5">
            {/* Background Image with Blur */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform group-hover:scale-105"
                style={{ backgroundImage: `url(${displayTrack.thumbnail})` }}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[10px] group-hover:backdrop-blur-sm transition-all duration-700"></div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-10 md:p-16 flex flex-col justify-end z-10">
                <div className="max-w-2xl space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 w-fit">
                            <span className={`w-2 h-2 rounded-full ${isPlayingHero && isPlaying ? 'bg-primary animate-pulse' : 'bg-white/40'}`}></span>
                            <span className="text-[10px] font-black text-white/90 tracking-[0.2em] uppercase">
                                {context}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl line-clamp-2">
                            {displayTrack.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/60 font-semibold drop-shadow-lg truncate">
                            {displayTrack.artist}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                        <button
                            onClick={() => isPlayingHero ? togglePlay() : playTrack(displayTrack)}
                            className="flex items-center gap-4 px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                            {isPlayingHero && isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" />}
                            {isPlayingHero ? (isPlaying ? 'PAUSE' : 'RESUME') : 'PLAY'}
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => toggleLike(displayTrack)}
                                className={`p-5 rounded-full backdrop-blur-xl border transition-all duration-500 group/btn active:scale-90 ${liked
                                    ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] text-primary'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                    }`}
                                title={liked ? "Unlike" : "Like"}
                            >
                                <Heart
                                    size={24}
                                    className={`transition-all duration-500 ${liked ? 'fill-primary scale-110' : 'group-hover/btn:scale-110'}`}
                                />
                            </button>

                            <button
                                className="p-5 rounded-full backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                                title="Add to Library"
                            >
                                <span className="material-icons-round text-2xl">playlist_add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Artwork Preview (Glassmorphism) */}
            <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-80 h-80 rounded-[3rem] overflow-hidden border border-white/10 hidden xl:block shadow-2xl rotate-6 group-hover:rotate-3 transition-transform duration-1000">
                <img src={displayTrack.thumbnail} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
            </div>

            {/* Decorative Glow */}
            <div className={`absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${liked ? 'bg-primary/30' : 'bg-white/10'}`}></div>
        </div>
    );
}
