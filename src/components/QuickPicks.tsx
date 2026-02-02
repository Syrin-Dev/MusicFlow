'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAudio } from './AudioProvider';
import { generateSmartDiscoveryQueries } from '@/lib/algorithm';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

// Keep hardcoded fallback just in case
const QUICK_PICK_QUERIES = [
    'best songs all time',
    'viral music 2024',
    'feel good music',
    'chill study music',
    'party music hits',
    'love songs 2024',
];

export function QuickPicks() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { playTrack, addToQueue, listeningHistory } = useAudio();

    const fetchTracks = useCallback(async () => {
        let queries = [];

        // Use smart discovery or fallback
        if (listeningHistory && listeningHistory.length > 0) {
            queries = generateSmartDiscoveryQueries(listeningHistory);
        } else {
            queries = QUICK_PICK_QUERIES;
        }

        // Pick 2 random logical queries to fill the quick picks initially
        // We want a mix, not just one query
        const query1 = queries[Math.floor(Math.random() * queries.length)];
        let query2 = queries[Math.floor(Math.random() * queries.length)];

        try {
            const [res1, res2] = await Promise.all([
                fetch(`/api/search?q=${encodeURIComponent(query1)}`),
                fetch(`/api/search?q=${encodeURIComponent(query2)}`)
            ]);

            const data1 = await res1.json();
            const data2 = await res2.json();

            let combined = [];
            if (Array.isArray(data1)) combined.push(...data1.slice(0, 8));
            if (Array.isArray(data2)) combined.push(...data2.slice(0, 8));

            // Shuffle them a bit so it's not blocked
            combined = combined.sort(() => Math.random() - 0.5);

            // Remove duplicates
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

            setTracks(unique.slice(0, 16));
        } catch (e) {
            console.error('Failed to fetch tracks:', e);
        }
        setLoading(false);
    }, [listeningHistory]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    const handlePlayAll = () => {
        if (tracks.length === 0) return;
        playTrack(tracks[0]);
        tracks.slice(1).forEach(track => addToQueue(track));
    };

    const handlePlayTrack = (track: Track, index: number) => {
        playTrack(track);
        tracks.slice(index + 1).forEach(t => addToQueue(t));
    };

    const loadMore = async () => {
        setLoadingMore(true);

        let queries = [];
        if (listeningHistory && listeningHistory.length > 0) {
            queries = generateSmartDiscoveryQueries(listeningHistory);
        } else {
            queries = QUICK_PICK_QUERIES;
        }

        const randomQuery = queries[Math.floor(Math.random() * queries.length)];

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(randomQuery)}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setTracks(prev => {
                    const newTracks = [...prev, ...data];
                    const uniqueTracks = Array.from(new Map(newTracks.map(item => [item.id, item])).values());
                    return uniqueTracks;
                });
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error('Failed to load more:', e);
        }
        setLoadingMore(false);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, track: Track) => {
        const img = e.currentTarget;
        if (img.src.includes('hqdefault')) {
            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
        } else {
            img.src = `https://i.ytimg.com/vi/${track.id}/default.jpg`;
        }
    };

    const columns: Track[][] = [[], [], [], []];
    tracks.forEach((track, index) => {
        const colIndex = index % 4;
        columns[colIndex].push(track);
    });

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Quick Picks</h3>
                <button
                    onClick={handlePlayAll}
                    disabled={loading || tracks.length === 0}
                    className="px-4 py-1.5 text-xs font-medium border border-white/10 text-gray-300 rounded-full hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                >
                    Play All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, colIndex) => (
                        <div key={colIndex} className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                                    <div className="w-12 h-12 rounded-lg bg-[#18181b]"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    columns.map((column, colIndex) => (
                        <div key={colIndex} className="space-y-2">
                            {column.map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => handlePlayTrack(track, tracks.findIndex(t => t.id === track.id))}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5"
                                >
                                    <img
                                        src={`https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                        alt={track.title}
                                        onError={(e) => handleImageError(e, track)}
                                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate text-gray-200 group-hover:text-[#8B5CF6] transition-colors">
                                            {track.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">
                                            {track.artist}
                                        </p>
                                    </div>
                                    <svg className="w-6 h-6 text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7L8 5z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {hasMore && !loading && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-white border border-white/10 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingMore && (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        )}
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </section>
    );
}
