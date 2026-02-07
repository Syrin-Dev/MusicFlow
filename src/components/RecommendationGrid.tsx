'use client';

import { Suspense, memo } from 'react';
import { useAudio } from './AudioProvider';
import { Play } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';

interface Result {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const TrackItem = memo(function TrackItem({ track, onClick }: { track: Result; onClick: () => void }) {
    return (
        <div
            className="group relative bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition-colors cursor-pointer"
            onClick={onClick}
        >
            <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-lg">
                <Image
                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                    alt={track.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized={!track.thumbnail?.includes('i.ytimg.com') && !track.thumbnail?.includes('yt3.ggpht.com')} // Safe fallback
                />
                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Play size={24} fill="black" className="ml-1" />
                    </div>
                </div>
            </div>

            <h4 className="font-semibold text-white truncate">{track.title}</h4>
            <p className="text-sm text-gray-400 truncate mt-1">{track.artist}</p>
        </div>
    );
});

function RecommendationGridContent() {
    const { playTrack } = useAudio();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || 'The Weeknd Mix';
    const title = searchParams.get('q') ? `Results for "${searchParams.get('q')}"` : 'Recommended for You';

    const { data: results } = useSWR<Result[]>(
        `/api/search?q=${encodeURIComponent(query)}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    const tracks = Array.isArray(results) ? results : [];

    return (
        <section>
            <h3 className="text-2xl font-bold mb-6 text-white capitalize">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tracks.map((track) => (
                    <TrackItem
                        key={track.id}
                        track={track}
                        onClick={() => playTrack(track)}
                    />
                ))}
            </div>
        </section>
    );
}

export function RecommendationGrid() {
    return (
        <Suspense fallback={<div className="text-white">Loading...</div>}>
            <RecommendationGridContent />
        </Suspense>
    );
}
