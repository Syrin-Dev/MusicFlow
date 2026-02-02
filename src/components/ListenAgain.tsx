'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from './AudioProvider';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

// Diverse discover queries as fallback
const DISCOVER_QUERIES = [
    'top charts today',
    'new music friday',
    'discover weekly',
    'ambient music',
    'jazz lounge music',
    'world music 2024',
    'classical crossover',
    'blues rock',
];

export function ListenAgain() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const { playTrack, addToQueue, listeningHistory } = useAudio();

    // Check for local user
    const [localUser, setLocalUser] = useState<{ name?: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('streamflow_user');
            if (stored) {
                setLocalUser(JSON.parse(stored));
            }
        }
    }, []);

    const userName = session?.user?.name || localUser?.name || 'You';

    const fetchTracks = useCallback(async () => {
        // First check if we have listening history
        if (listeningHistory && listeningHistory.length > 0) {
            setTracks(listeningHistory.slice(0, 4));
            setLoading(false);
            return;
        }

        // Fallback to random discovery if no history
        const randomQuery = DISCOVER_QUERIES[Math.floor(Math.random() * DISCOVER_QUERIES.length)];
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(randomQuery)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTracks(data.slice(0, 4));
            }
        } catch (e) {
            console.error('Failed to fetch tracks:', e);
        }
        setLoading(false);
    }, [listeningHistory]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks, listeningHistory]);

    const handlePlayTrack = (track: Track, index: number) => {
        playTrack(track);
        tracks.slice(index + 1).forEach(t => addToQueue(t));
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, track: Track) => {
        const img = e.currentTarget;
        if (img.src.includes('hqdefault')) {
            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
        } else {
            img.src = `https://i.ytimg.com/vi/${track.id}/default.jpg`;
        }
    };

    return (
        <section>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#8B5CF6]/50">
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={userName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-xs text-[#8B5CF6] font-bold uppercase tracking-wide">{userName}</p>
                    <h3 className="text-2xl font-bold text-white">Listen Again</h3>
                </div>
                <div className="ml-auto">
                    {/* Only show refresh button if we are using fallback discovery (no history) */}
                    {(!listeningHistory || listeningHistory.length === 0) && (
                        <button
                            onClick={() => {
                                setLoading(true); // Manually trigger loading state for visual feedback
                                fetchTracks();
                            }}
                            className="px-4 py-1.5 text-xs font-medium border border-white/10 text-gray-300 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                        >
                            More
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(loading && tracks.length === 0) ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-3">
                            <div className="aspect-[4/3] rounded-2xl bg-[#18181b]"></div>
                            <div className="h-5 bg-[#18181b] rounded w-3/4"></div>
                            <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                        </div>
                    ))
                ) : (
                    tracks.map((track, index) => (
                        <div
                            key={track.id}
                            className="space-y-3 group cursor-pointer"
                            onClick={() => handlePlayTrack(track, index)}
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/5">
                                <img
                                    src={`https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                    alt={track.title}
                                    onError={(e) => handleImageError(e, track)}
                                    className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7L8 5z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-tight text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                                    {track.title}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <span className="truncate">Song • {track.artist}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
