'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAudio } from './AudioProvider';
import { Play } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Result {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

function RecommendationGridContent() {
    const [results, setResults] = useState<Result[]>([]);
    const { playTrack } = useAudio();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || 'The Weeknd Mix';
    const title = searchParams.get('q') ? `Results for "${searchParams.get('q')}"` : 'Recommended for You';

    useEffect(() => {
        setResults([]); // Clear previous results
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setResults(data);
                } else {
                    console.error("API response is not an array:", data);
                }
            })
            .catch(err => console.error("Fetch error:", err));
    }, [query]);

    return (
        <section>
            <h3 className="text-2xl font-bold mb-6 text-white capitalize">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.map((track) => (
                    <div
                        key={track.id}
                        className="group relative bg-[#18181b] p-4 rounded-xl hover:bg-[#27272a] transition-colors cursor-pointer"
                        onClick={() => playTrack(track)}
                    >
                        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-lg">
                            <img
                                src={track.thumbnail}
                                alt={track.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
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
