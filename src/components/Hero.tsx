'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

export function Hero() {
    const { playTrack, currentTrack, isLiked, toggleLike, isPlaying, togglePlay } = useAudio();
    const [randomTrack, setRandomTrack] = useState<any>(null);

    // Some curated hits to show in hero if nothing playing
    const FEATURED_HITS = [
        { id: '1-xGerv5FOk', title: 'Starboy', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/1-xGerv5FOk/maxresdefault.jpg' },
        { id: 'm7Bc3pLyij0', title: 'Happier Than Ever', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/m7Bc3pLyij0/maxresdefault.jpg' },
        { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg' },
        { id: '0Wq29tqP2v0', title: 'Levitating', artist: 'Dua Lipa', thumbnail: 'https://i.ytimg.com/vi/0Wq29tqP2v0/maxresdefault.jpg' },
    ];

    useEffect(() => {
        // Pick a random track on mount
        const randomIndex = Math.floor(Math.random() * FEATURED_HITS.length);
        setRandomTrack(FEATURED_HITS[randomIndex]);
    }, []);

    if (!randomTrack) return null;

    const displayTrack = currentTrack || randomTrack;
    const isPlayingHero = currentTrack?.id === displayTrack.id;
    const liked = isLiked(displayTrack.id);

    return (
        <div className="relative w-full h-[400px] rounded-[2rem] overflow-hidden shadow-2xl group border border-white/5 mt-4">
            {/* Background Image with Blur */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform group-hover:scale-110"
                style={{ backgroundImage: `url(${displayTrack.thumbnail})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-700"></div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end z-10">
                <div className="max-w-xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit">
                        <span className={`w-2 h-2 rounded-full ${isPlayingHero && isPlaying ? 'bg-violet-500 animate-pulse' : 'bg-gray-400'} shadow-[0_0_8px_#8B5CF6]`}></span>
                        <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">
                            {isPlayingHero ? (isPlaying ? 'Now Playing' : 'Paused') : 'Featured Hit'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl line-clamp-2 pr-4">
                            {displayTrack.title}
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-300 font-medium drop-shadow-lg truncate max-w-full">
                            {displayTrack.artist}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            onClick={() => isPlayingHero ? togglePlay() : playTrack(displayTrack)}
                            className="flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
                        >
                            {isPlayingHero && isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
                            {isPlayingHero ? (isPlaying ? 'Pause' : 'Resume') : 'Play Now'}
                        </button>

                        <button
                            onClick={() => toggleLike(displayTrack)}
                            className={`p-5 rounded-full backdrop-blur-md border transition-all duration-500 group/btn active:scale-90 ${liked
                                ? 'bg-violet-600/20 border-violet-500 text-violet-500'
                                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <Heart
                                size={28}
                                className={`transition-all duration-500 ${liked ? 'fill-violet-500 scale-110' : 'group-hover/btn:scale-110'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        </div>
    );
}
