'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

const STORIES = [
    { id: '1', artist: 'The Weeknd', image: 'https://i.scdn.co/image/ab67616d0000b2732a96cbd8b4cf3a630549182d', trackId: '1-xGerv5FOk', title: 'Starboy' },
    { id: '2', artist: 'Dua Lipa', image: 'https://i.scdn.co/image/ab67616d0000b27394d28dc7f01cba6aa649232d', trackId: 'bcQSzL6f1EM', title: 'Dance The Night' },
    { id: '3', artist: 'Drake', image: 'https://i.scdn.co/image/ab67616d0000b2734638361ab7b5883d65aa213f', trackId: 'rubNlX5ZcwI', title: 'Passionfruit' },
    { id: '4', artist: 'Taylor Swift', image: 'https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b75120a3a', trackId: 'e-ORhEE9VVg', title: 'Blank Space' },
    { id: '5', artist: 'Bad Bunny', image: 'https://i.scdn.co/image/ab67616d0000b27349d694203245f241a1bcaa72', trackId: 'hLOkjoF5lMI', title: 'Ojitos Lindos' },
    { id: '6', artist: 'SZA', image: 'https://i.scdn.co/image/ab67616d0000b27370dbc9f47669d120ad87461a', trackId: 'h20aT3-gDqU', title: 'Kill Bill' },
    { id: '7', artist: 'Ariana Grande', image: 'https://i.scdn.co/image/ab67616d0000b273cd945b4babad7c650228d40f', trackId: 'SXIIT73WjNQ', title: '7 rings' },
    { id: '8', artist: 'Travis Scott', image: 'https://i.scdn.co/image/ab67616d0000b273e71783fb737a4e680a6c0e81', trackId: 'Dst9gZkq1a8', title: 'SICKO MODE' },
];

export function ArtistStories() {
    const { playTrack } = useAudio();
    const [viewed, setViewed] = useState<string[]>([]);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const handleStoryClick = (story: typeof STORIES[0]) => {
        playTrack({
            id: story.trackId,
            title: story.title,
            artist: story.artist,
            thumbnail: story.image,
        });

        if (!viewed.includes(story.id)) {
            setViewed(prev => [...prev, story.id]);
        }
    };

    const handleImageError = (id: string) => {
        setImageErrors(prev => new Set(prev).add(id));
    };

    return (
        <div className="w-full overflow-hidden py-2">
            <div className="flex items-center justify-between px-1 mb-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Releases • Stories</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar px-2">
                {STORIES.map((story) => {
                    const isViewed = viewed.includes(story.id);
                    const hasError = imageErrors.has(story.id);

                    return (
                        <div
                            key={story.id}
                            className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0 relative"
                            onClick={() => handleStoryClick(story)}
                        >
                            {/* Gradient Border Ring */}
                            <div className={`
                                relative p-[2px] rounded-full transition-all duration-500 shadow-xl
                                ${isViewed
                                    ? 'bg-zinc-700 opacity-60 scale-95'
                                    : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-600 scale-100 group-hover:scale-105 group-hover:rotate-3'}
                            `}>
                                {/* Inner separation ring */}
                                <div className="p-[3px] bg-[#0A0A0B] rounded-full relative z-10">
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-black shadow-inner">
                                        {hasError ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900 to-indigo-900">
                                                <span className="text-2xl font-bold text-white/50 select-none">
                                                    {story.artist.charAt(0)}
                                                </span>
                                            </div>
                                        ) : (
                                            <img
                                                src={story.image}
                                                alt={story.artist}
                                                referrerPolicy="no-referrer"
                                                onError={() => handleImageError(story.id)}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        )}

                                        {/* Play Icon Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <Play size={28} fill="white" className="text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <span className="text-xs font-medium text-zinc-400 truncate w-24 text-center group-hover:text-white transition-colors duration-300">
                                {story.artist}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
