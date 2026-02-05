'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ChevronLeft, ChevronRight, Hash, Clock, Loader2 } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
    views?: string;
    type?: 'video' | 'playlist' | 'album';
}

interface Mood {
    id: string;
    name: string;
    color: string;
}

export default function ExplorePage() {
    const router = useRouter();
    const { playTrack } = useAudio();
    const [data, setData] = useState<{
        trending: Track[],
        newReleases: Track[],
        moods: Mood[]
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [viewAllTrending, setViewAllTrending] = useState(false);

    // Infinite scroll state
    const [albums, setAlbums] = useState<Track[]>([]);
    const [albumPage, setAlbumPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/explore')
            .then(res => res.json())
            .then(resData => {
                if (resData.error) {
                    setError(true);
                } else {
                    setData(resData);
                    setAlbums(resData.newReleases || []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, []);

    const loadMoreAlbums = useCallback(async () => {
        if (loadingMore) return;

        setLoadingMore(true);
        try {
            const nextPage = albumPage + 1;
            const res = await fetch(`/api/explore/more?type=albums&page=${nextPage}`);
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                setAlbums(prev => [...prev, ...data.items]);
                setAlbumPage(nextPage);
            }
        } catch (err) {
            console.error('Error loading more albums:', err);
        }
        setLoadingMore(false);
    }, [albumPage, loadingMore]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = 600;

            // Check if we're near the end and need to load more
            if (direction === 'right') {
                const isNearEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 300;
                if (isNearEnd) {
                    loadMoreAlbums();
                }
            }

            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 overflow-y-auto bg-[#0A0A0B] space-y-12">
                <div className="animate-pulse flex gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-32 bg-white/5 rounded-full"></div>)}
                </div>
                <div className="space-y-4">
                    <div className="h-8 w-48 bg-white/5 rounded"></div>
                    <div className="flex gap-6 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-48 w-48 flex-shrink-0 bg-white/5 rounded-2xl"></div>)}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                Failed to load explore content. Please try again.
            </div>
        );
    }

    // Safely access arrays with fallbacks
    const trending = data.trending || [];
    const newReleases = data.newReleases || [];
    const moods = data.moods || [];

    const visibleTrending = viewAllTrending ? trending : trending.slice(0, 6);

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">

            <div className="p-4 md:p-8 space-y-10 md:space-y-12">

                {/* 1. New Albums & Singles (Playlists) */}
                {albums.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">New Releases</h2>
                            <div className="flex gap-2 items-center">
                                {loadingMore && <Loader2 size={20} className="animate-spin text-violet-500" />}
                                <button onClick={() => scroll('left')} className="p-2 rounded-full bg-[#1A1A1E] text-white hover:bg-white/20 transition-colors border border-white/5"><ChevronLeft size={20} /></button>
                                <button onClick={() => scroll('right')} className="p-2 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors border border-white/5"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div ref={scrollContainerRef} className="flex gap-4 md:gap-6 overflow-x-auto md:overflow-x-hidden pb-4 snap-x scroll-smooth no-scrollbar">
                            {albums.map((track, i) => (
                                <div
                                    key={`${track.id}-${i}`}
                                    className="group relative flex-shrink-0 w-40 md:w-56 snap-start cursor-pointer transition-transform duration-300"
                                    onClick={() => router.push(`/playlist/${track.id}`)}
                                >
                                    <div className="relative aspect-square rounded-2xl md:rounded-[24px] overflow-hidden mb-3 md:mb-4 shadow-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
                                        <img
                                            src={track.thumbnail || ''}
                                            alt={track.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />

                                        {/* Playlist Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold hover:bg-white/40 transition-colors">
                                                VIEW
                                            </button>
                                            <button className="p-3 bg-white text-black rounded-full shadow-xl transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                <Play size={20} fill="currentColor" className="ml-0.5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold">ALBUM</div>
                                    </div>
                                    <h3 className="text-white font-bold truncate pr-2 text-lg">{track.title}</h3>
                                    <p className="text-sm text-slate-400 truncate">{track.artist}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Trending Songs */}
                {trending.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Trending Now</h2>
                            <button
                                onClick={() => setViewAllTrending(!viewAllTrending)}
                                className="text-xs font-bold text-[#8B5CF6] hover:text-white transition-colors uppercase tracking-wider"
                            >
                                {viewAllTrending ? 'Show Less' : 'View All'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all">
                            {visibleTrending.map((track, index) => (
                                <div
                                    key={`${track.id}-${index}`}
                                    className="group flex items-center gap-4 p-3 rounded-2xl bg-[#1A1A1E]/50 border border-transparent hover:border-white/10 hover:bg-[#1A1A1E] transition-all cursor-pointer"
                                    onClick={() => playTrack(track)}
                                >
                                    <span className={`w-8 text-center font-bold text-lg ${index < 3 ? 'text-[#8B5CF6]' : 'text-slate-600'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#111]">
                                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Play size={16} fill="white" className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-sm truncate group-hover:text-[#8B5CF6] transition-colors">{track.title}</h3>
                                        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                                    </div>
                                    <div className="px-4 text-xs font-medium text-slate-500 tabular-nums flex items-center gap-1">
                                        <Clock size={12} />
                                        {track.duration || '3:30'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Moods & Genres */}
                <section>
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Moods & Genres</h2>
                        <button className="p-2 rounded-full bg-[#1A1A1E] text-white hover:bg-white/20 transition-colors border border-white/5"><ChevronRight size={20} /></button>

                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {moods.map((mood) => (
                            <div
                                key={mood.id}
                                onClick={() => router.push(`/explore/${mood.id}`)}
                                className="relative h-16 rounded-xl overflow-hidden bg-[#1A1A1E] hover:bg-[#252529] transition-colors cursor-pointer group flex items-center border border-white/5 hover:border-white/10"
                            >
                                <div className="w-1.5 h-full mr-4" style={{ backgroundColor: mood.color }}></div>
                                <span className="font-bold text-white group-hover:translate-x-1 transition-transform">{mood.name}</span>
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                                    style={{ background: `linear-gradient(to right, ${mood.color}, transparent)` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
