'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAudio } from './AudioProvider';
import { generateSmartDiscoveryQueries } from '@/lib/algorithm';

interface Video {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    views?: string;
}

// Fallback if no history
const VIDEO_QUERIES = [
    'official music video 2024',
    'latest music videos',
    'trending music videos',
    'new release music video',
];

export function MusicVideos() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const { playTrack, addToQueue, listeningHistory } = useAudio();

    const fetchVideos = useCallback(async () => {
        let query = '';

        if (listeningHistory && listeningHistory.length > 0) {
            // Smart discovery based on history
            const queries = generateSmartDiscoveryQueries(listeningHistory);
            // Append "music video" to ensure we get videos
            query = `${queries[0]} music video`;
        } else {
            // Fallback
            query = VIDEO_QUERIES[Math.floor(Math.random() * VIDEO_QUERIES.length)];
        }

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setVideos(data.slice(0, 4));
            }
        } catch (e) {
            console.error('Failed to fetch videos:', e);
        }
        setLoading(false);
    }, [listeningHistory]);

    useEffect(() => {
        fetchVideos();
    }, [listeningHistory]); // Re-run when history updates

    const handlePlayVideo = (video: Video, index: number) => {
        playTrack(video);
        // Add remaining to queue
        videos.slice(index + 1).forEach(v => addToQueue(v));
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, video: Video) => {
        const img = e.currentTarget;
        if (img.src.includes('maxresdefault')) {
            img.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
        } else if (img.src.includes('hqdefault')) {
            img.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Music Videos for You</h3>
                <button
                    onClick={fetchVideos}
                    className="px-4 py-1.5 text-xs font-medium border border-white/10 text-gray-300 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-video rounded-2xl bg-[#18181b] mb-3"></div>
                            <div className="h-4 bg-[#18181b] rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-[#18181b] rounded w-1/2"></div>
                        </div>
                    ))
                ) : (
                    videos.map((video, index) => (
                        <div
                            key={video.id}
                            className="group cursor-pointer"
                            onClick={() => handlePlayVideo(video, index)}
                        >
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-[#18181b] shadow-lg ring-1 ring-white/5">
                                <img
                                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                                    alt={video.title}
                                    onError={(e) => handleImageError(e, video)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:bg-[#8B5CF6] group-hover:border-[#8B5CF6] transition-colors duration-300 shadow-xl">
                                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7L8 5z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <h4 className="font-semibold text-base text-white truncate">{video.title}</h4>
                            <p className="text-xs text-gray-400">{video.artist}</p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
