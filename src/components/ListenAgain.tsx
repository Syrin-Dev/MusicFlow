'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from './AudioProvider';
import { Play, RotateCcw } from 'lucide-react';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

const DISCOVER_QUERIES = [
    'top charts today', 'new music friday', 'discover weekly', 'ambient music',
    'jazz lounge music', 'world music 2024', 'classical crossover', 'blues rock'
];

export function ListenAgain() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const { playTrack, addToQueue, listeningHistory } = useAudio();
    const [localUser, setLocalUser] = useState<{ name?: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('hievly_user');
            if (stored) setLocalUser(JSON.parse(stored));
        }
    }, []);

    const userName = session?.user?.name || localUser?.name || 'You';

    const fetchTracks = useCallback(async () => {
        if (listeningHistory && listeningHistory.length > 0) {
            setTracks(listeningHistory.slice(0, 4));
            setLoading(false);
            return;
        }

        const randomQuery = DISCOVER_QUERIES[Math.floor(Math.random() * DISCOVER_QUERIES.length)];
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(randomQuery)}`);
            const data = await res.json();
            if (Array.isArray(data)) setTracks(data.slice(0, 4));
        } catch (e) {
            console.error('Failed to fetch tracks:', e);
        }
        setLoading(false);
    }, [listeningHistory]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks, listeningHistory]);

    return (
        <section suppressHydrationWarning className="animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="relative group">
                    <div className="w-14 h-14 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-[#8B5CF6] to-[#D946EF] shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                <div suppressHydrationWarning className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xl uppercase">
                                    {userName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-white tracking-tight">Listen Again</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-0.5">Your Sound • {userName}</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchTracks(); }}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors group border border-white/5"
                    title="More recommendations"
                >
                    <RotateCcw size={18} className="text-zinc-400 group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(loading && tracks.length === 0) ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-4">
                            <div className="aspect-[16/10] rounded-3xl bg-white/5"></div>
                            <div className="h-5 bg-white/5 rounded-full w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
                        </div>
                    ))
                ) : (
                    tracks.map((track, index) => (
                        <div
                            key={track.id}
                            className="group cursor-pointer"
                            onClick={() => {
                                playTrack(track);
                                tracks.slice(index + 1).forEach(t => addToQueue(t));
                            }}
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] bg-zinc-900 border border-white/5">
                                <img
                                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                    alt={track.title}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        // Try different quality thumbnails before giving up
                                        if (img.src.includes('hqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
                                        } else if (img.src.includes('mqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/default.jpg`;
                                        } else {
                                            // Fallback to a gradient div if image fails completely
                                            img.style.display = 'none';
                                            img.parentElement?.classList.add('bg-gradient-to-br', 'from-zinc-800', 'to-zinc-900');
                                        }
                                    }}
                                    className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                                        <Play size={24} fill="black" className="ml-1 text-black" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 px-1">
                                <h4 className="font-bold text-base leading-tight text-zinc-100 group-hover:text-[#8B5CF6] transition-colors truncate">
                                    {track.title}
                                </h4>
                                <p className="text-xs text-zinc-500 mt-1 truncate font-medium">{track.artist}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
