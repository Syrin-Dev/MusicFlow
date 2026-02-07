'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { useAudio } from './AudioProvider';
import { generateSmartDiscoveryQueries } from '@/lib/algorithm';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper function outside component
function getQueryData(history: any[], index: number) {
    const queries = generateSmartDiscoveryQueries(history);
    // Ensure we have at least one query
    const safeQueries = queries.length > 0 ? queries : ['new music'];
    const query = safeQueries[index % safeQueries.length];

    let source = 'Recommended for you';
    if (query.includes('like')) {
        source = `Because you like ${query.replace('people like ', '').replace('artists like ', '').replace('music like ', '')}`;
    } else if (query.includes('mix')) {
        source = 'Mix for you';
    }

    return {
        url: `/api/search?q=${encodeURIComponent(query)}`,
        source
    };
}

export function RecommendedGrid() {
    // State for navigation
    const [queryStack, setQueryStack] = useState<{ url: string, source: string }[]>([]);

    const { playTrack, addToQueue, listeningHistory, openConnect } = useAudio();
    const queryIndexRef = useRef(0);

    // Initialize state lazily
    const [{ currentQueryUrl, recSource }, setQueryState] = useState(() => {
        const data = getQueryData(listeningHistory, 0);
        return {
            currentQueryUrl: data.url,
            recSource: data.source
        };
    });

    // Helper to update
    const updateToNextQuery = useCallback(() => {
        // Increment index
        queryIndexRef.current += 1;
        const { url, source } = getQueryData(listeningHistory, queryIndexRef.current);

        setQueryStack(prev => [...prev, { url: currentQueryUrl, source: recSource }]);
        setQueryState({ currentQueryUrl: url, recSource: source });
    }, [listeningHistory, currentQueryUrl, recSource]);

    // SWR Fetching
    const { data: tracksData, isLoading: loading } = useSWR(currentQueryUrl, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
        keepPreviousData: true,
    });

    const tracks = useMemo(() => {
        return Array.isArray(tracksData) ? tracksData.slice(0, 5) : [];
    }, [tracksData]);

    const handleNext = () => {
        updateToNextQuery();
    };

    const handlePrevious = () => {
        if (queryStack.length === 0) return;
        const previous = queryStack[queryStack.length - 1];
        setQueryStack(prev => prev.slice(0, -1));
        setQueryState({ currentQueryUrl: previous.url, recSource: previous.source });
    };

    const handlePlayTrack = (track: Track, index: number) => {
        playTrack(track);
        tracks.slice(index + 1).forEach((t: Track) => addToQueue(t));
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
                        disabled={loading || queryStack.length === 0}
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

            <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-opacity duration-300 ${loading && !tracks.length ? 'opacity-50' : 'opacity-100'}`}>
                {loading && !tracks.length ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square rounded-2xl bg-[#18181b] mb-3"></div>
                            <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                        </div>
                    ))
                ) : (
                    tracks.map((track: Track, index: number) => (
                        <div
                            key={track.id}
                            className="group cursor-pointer"
                            onClick={() => handlePlayTrack(track, index)}
                        >
                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-[#18181b] shadow-lg ring-1 ring-white/5">
                                <Image
                                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                    alt={track.title}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                    unoptimized={!track.thumbnail?.includes('i.ytimg.com')}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index); }}
                                        className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110 active:scale-95"
                                    >
                                        <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7L8 5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openConnect(track); }}
                                        className="relative z-10 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 hover:bg-white/20 hover:scale-110 active:scale-95"
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
