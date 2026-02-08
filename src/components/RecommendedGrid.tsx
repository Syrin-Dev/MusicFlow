'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAudio } from './AudioProvider';
import { generateSmartDiscoveryQueries } from '@/lib/algorithm';
import { toUnifiedTrack } from '@/lib/types/music';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

interface RecommendedGridProps {
    initialTracks?: Track[];
}

export function RecommendedGrid({ initialTracks }: RecommendedGridProps) {
    const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
    const [loading, setLoading] = useState(!initialTracks);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [historyStack, setHistoryStack] = useState<Track[][]>([]);
    const [recSource, setRecSource] = useState('Based on your taste');

    // Track which query index we're on for variety
    const queryIndexRef = useRef(0);

    const { playTrack, addToQueue, listeningHistory, openConnect } = useAudio();

    const fetchRecommendations = useCallback(async (saveToHistory = false) => {
        setLoading(true);
        // Use our new smart algorithm
        const queries = generateSmartDiscoveryQueries(listeningHistory);

        // Rotate through queries for variety
        const queryIndex = queryIndexRef.current % queries.length;
        const query = queries[queryIndex];
        queryIndexRef.current += 1;

        // Update the "Based on..." text
        if (query.includes('like')) {
            setRecSource(`Because you like ${query.replace('people like ', '').replace('artists like ', '').replace('music like ', '')}`);
        } else if (query.includes('mix')) {
            setRecSource('Mix for you');
        } else {
            setRecSource('Recommended for you');
        }

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            // Handle both paginated response and legacy array response
            let results: Track[] = [];
            if (data.results && Array.isArray(data.results)) {
                results = data.results;
            } else if (Array.isArray(data)) {
                results = data;
            }

            if (results.length > 0) {
                // Ensure thumbnails have fallbacks
                const tracksWithThumbnails = results.slice(0, 5).map(t => ({
                    ...t,
                    thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`
                }));

                if (saveToHistory && tracks.length > 0) {
                    setHistoryStack(prev => [...prev, tracks]);
                }
                setTracks(tracksWithThumbnails);
            }
        } catch (e) {
            console.error('Failed to fetch recommendations:', e);
        }
        setLoading(false);
    }, [tracks, listeningHistory]);

    useEffect(() => {
        if (!initialTracks) {
            fetchRecommendations(false);
        }
    }, [initialTracks]); // Only run on mount if no initial tracks

    const handleNext = async () => {
        setIsTransitioning(true);
        setTimeout(async () => {
            await fetchRecommendations(true);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrevious = () => {
        if (historyStack.length === 0) return;

        setIsTransitioning(true);
        setTimeout(() => {
            const previousTracks = historyStack[historyStack.length - 1];
            setHistoryStack(prev => prev.slice(0, -1));
            setTracks(previousTracks);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePlayTrack = (track: Track, index: number) => {
        playTrack(toUnifiedTrack(track));
        tracks.slice(index + 1).forEach(t => addToQueue(toUnifiedTrack(t)));
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">Recommended For You</h3>
                    {!loading && <p className="hidden md:block text-xs text-gray-400 mt-1 capitalize">{recSource}</p>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrevious}
                        disabled={loading || historyStack.length === 0}
                        className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="w-9 h-9 rounded-full bg-[#8B5CF6] flex items-center justify-center hover:bg-violet-600 text-white transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square rounded-2xl bg-[#18181b] mb-3"></div>
                            <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                        </div>
                    ))
                ) : (
                    tracks.map((track, index) => (
                        <div
                            key={track.id}
                            className="group cursor-pointer"
                            onClick={() => handlePlayTrack(track, index)}
                        >
                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-[#18181b] shadow-lg ring-1 ring-white/5">
                                <img
                                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                    alt={track.title}
                                    loading="lazy"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (img.src.includes('maxresdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                                        } else if (img.src.includes('hqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
                                        } else if (!img.src.includes('mqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/default.jpg`;
                                        }
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index); }}
                                        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110 active:scale-95"
                                    >
                                        <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7L8 5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openConnect(toUnifiedTrack(track)); }}
                                        className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 hover:bg-white/20 hover:scale-110 active:scale-95"
                                        title="Share with friends"
                                    >
                                        <span className="material-icons-round text-xl">share</span>
                                    </button>
                                </div>
                            </div>
                            <h4 className="font-semibold text-sm truncate text-gray-100">{track.title}</h4>
                            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
