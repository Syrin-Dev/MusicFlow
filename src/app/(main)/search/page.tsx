'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAudio } from '@/components/AudioProvider';
import { toUnifiedTrack } from '@/lib/types/music';
import { Loader2 } from 'lucide-react';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

interface SearchResponse {
    results: Track[];
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
}

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const { playTrack, addToQueue } = useAudio();

    const LIMIT = 20;

    const fetchResults = useCallback(async (isLoadMore = false) => {
        if (!query) return;

        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setTracks([]);
            setOffset(0);
        }

        try {
            const currentOffset = isLoadMore ? offset : 0;
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(query)}&offset=${currentOffset}&limit=${LIMIT}`
            );
            const data: SearchResponse = await res.json();

            if (data.results && Array.isArray(data.results)) {
                if (isLoadMore) {
                    setTracks(prev => [...prev, ...data.results]);
                } else {
                    setTracks(data.results);
                }
                setHasMore(data.hasMore);
                setOffset(currentOffset + data.results.length);
            } else if (Array.isArray(data)) {
                // Fallback for old API format
                setTracks(isLoadMore ? [...tracks, ...data] : data);
                setHasMore(false);
            }
        } catch (e) {
            console.error('Search failed', e);
        }

        setLoading(false);
        setLoadingMore(false);
    }, [query, offset, tracks]);

    useEffect(() => {
        fetchResults(false);
    }, [query]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchResults(true);
        }
    };

    const handlePlay = (track: Track, index: number) => {
        playTrack(toUnifiedTrack(track));
        // Queue the rest of the search results
        tracks.slice(index + 1).forEach(t => addToQueue(toUnifiedTrack(t)));
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, track: Track) => {
        const img = e.currentTarget;
        // Cascade through YouTube thumbnail qualities
        if (img.src.includes('maxresdefault')) {
            img.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
        } else if (img.src.includes('hqdefault')) {
            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
        } else if (img.src.includes('mqdefault')) {
            img.src = `https://i.ytimg.com/vi/${track.id}/default.jpg`;
        }
    };

    if (!query) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                Type something to search...
            </div>
        );
    }

    return (
        <div className="px-8 pb-32 pt-6">
            <h2 className="text-3xl font-bold text-white mb-6">Results for "{query}"</h2>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square rounded-2xl bg-[#18181b] mb-3"></div>
                            <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : tracks.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {tracks.map((track, index) => (
                            <div
                                key={`${track.id}-${index}`}
                                className="group cursor-pointer"
                                onClick={() => handlePlay(track, index)}
                            >
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-[#18181b] shadow-lg ring-1 ring-white/5">
                                    <img
                                        src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                        alt={track.title}
                                        onError={(e) => handleImageError(e, track)}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <span className="w-14 h-14 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7L8 5z" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <h4 className="font-semibold text-base truncate text-gray-100 mb-1">{track.title}</h4>
                                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center gap-2 px-8 py-3 bg-[#8B5CF6] hover:bg[#7C3AED] text-white font-semibold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-400">No results found for "{query}"</p>
                    <p className="text-sm text-gray-500 mt-2">Try searching for something else.</p>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <>
            <Suspense fallback={<div className="p-8 text-white">Loading search...</div>}>
                <SearchResultsContent />
            </Suspense>
        </>
    );
}
