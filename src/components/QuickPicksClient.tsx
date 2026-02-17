'use client';

import { useState, useCallback } from 'react';
import { useAudio } from './AudioProvider';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

const QUICK_PICK_QUERIES = [
    'best songs all time',
    'viral music 2024',
    'feel good music',
    'chill study music',
    'party music hits',
    'love songs 2024',
];

interface QuickPicksClientProps {
    initialTracks: Track[];
}

const QuickPickItem = memo(({ track, onClick }: { track: Track, onClick: () => void }) => {
    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/5 active:scale-[0.98]"
        >
            <div className="relative w-14 h-14 flex-shrink-0">
                <Image
                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                    alt={track.title}
                    fill
                    sizes="56px"
                    className="rounded-md object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center backdrop-blur-[1px]">
                    <Play size={20} className="text-white fill-white ml-0.5" />
                </div>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
                <h4 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                    {track.title}
                </h4>
                <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
                    {track.artist}
                </p>
            </div>
        </div>
    );
});

QuickPickItem.displayName = 'QuickPickItem';

export function QuickPicksClient({ initialTracks }: QuickPicksClientProps) {
    const [tracks, setTracks] = useState<Track[]>(initialTracks);
    const [loadingMore, setLoadingMore] = useState(false);
    const { playTrack, addToQueue } = useAudio();

    const loadMoreTracks = async () => {
        if (loadingMore) return;
        setLoadingMore(true);

        const queries = QUICK_PICK_QUERIES;
        const query1 = queries[Math.floor(Math.random() * queries.length)];
        const query2 = queries[Math.floor(Math.random() * queries.length)];

        try {
            const [res1, res2] = await Promise.all([
                fetch(`/api/search?q=${encodeURIComponent(query1)}`),
                fetch(`/api/search?q=${encodeURIComponent(query2)}`)
            ]);

            const data1 = await res1.json();
            const data2 = await res2.json();

            let newTracks: Track[] = [];
            if (Array.isArray(data1)) newTracks.push(...data1.slice(0, 8));
            if (Array.isArray(data2)) newTracks.push(...data2.slice(0, 8));

            setTracks(prev => {
                const combined = [...prev, ...newTracks];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique;
            });
        } catch (e) {
            console.error('Failed to load more tracks:', e);
        }
        setLoadingMore(false);
    };

    const handlePlayAll = useCallback(() => {
        if (tracks.length === 0) return;
        playTrack(tracks[0]);
        tracks.slice(1).forEach(track => addToQueue(track));
    }, [tracks, playTrack, addToQueue]);

    const handlePlayTrack = useCallback((track: Track, index: number) => {
        playTrack(track);
        tracks.slice(index + 1).forEach(t => addToQueue(t));
    }, [tracks, playTrack, addToQueue]);

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white tracking-tight">Quick Picks</h3>
                <button
                    onClick={handlePlayAll}
                    disabled={tracks.length === 0}
                    className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/10 text-zinc-400 rounded-full hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                    Play All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tracks.map((track, index) => (
                    <QuickPickItem
                        key={`${track.id}-${index}`}
                        track={track}
                        onClick={() => handlePlayTrack(track, index)}
                    />
                ))}
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={loadMoreTracks}
                    disabled={loadingMore}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loadingMore ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Loading...
                        </>
                    ) : (
                        'Load More'
                    )}
                </button>
            </div>
        </section>
    );
}
