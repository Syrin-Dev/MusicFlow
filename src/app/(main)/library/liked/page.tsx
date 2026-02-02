'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ChevronLeft, Clock, Heart, Shuffle, MoreHorizontal } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string | number;
}

export default function LikedSongsPage() {
    const router = useRouter();
    const { playTrack, currentTrack, isPlaying, addToQueue, likedSongs } = useAudio();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use likedSongs from AudioProvider which are already synced or fetch fresh
        fetch('/api/user/likes')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTracks(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const playAll = (shuffle = false) => {
        if (!tracks.length) return;

        let playQueue = [...tracks];
        if (shuffle) {
            playQueue = playQueue.sort(() => Math.random() - 0.5);
        }

        playTrack(playQueue[0]);
        playQueue.slice(1).forEach(track => addToQueue(track));
    };

    const formatDuration = (seconds?: string | number) => {
        if (!seconds) return '-';
        const sec = Number(seconds);
        if (isNaN(sec)) return seconds;

        const minutes = Math.floor(sec / 60);
        const remainingSeconds = sec % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex-1 bg-[#0A0A0B] p-8 space-y-8">
                <div className="h-64 rounded-3xl bg-white/5 animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-32">
            {/* Header */}
            <div className="relative h-[45vh] min-h-[350px] flex flex-col justify-between p-8 bg-gradient-to-b from-violet-900/50 to-[#0A0A0B]">
                <div className="w-full z-20">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-colors border border-white/5"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-end gap-8 z-10 w-full">
                    {/* Cover Art */}
                    <div className="w-52 h-52 md:w-64 md:h-64 rounded-2xl shadow-2xl shadow-violet-900/20 overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                        <Heart size={80} className="text-white" fill="white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2 min-w-0">
                        <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Playlist</p>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 truncate shadow-lg">Liked Songs</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="font-semibold text-white">You</span>
                            <span>•</span>
                            <span>{tracks.length} songs</span>
                        </div>
                    </div>

                    {/* Play Buttons */}
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => playAll(false)}
                            className="bg-[#8B5CF6] hover:bg-[#7be] text-white rounded-full p-4 shadow-xl hover:scale-105 transition-all"
                        >
                            <Play size={28} fill="currentColor" className="ml-1" />
                        </button>
                        <button
                            onClick={() => playAll(true)}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-md transition-all"
                        >
                            <Shuffle size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracks List */}
            <div className="px-8 mt-8 space-y-1">
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-sm font-medium text-slate-500 border-b border-white/5 mb-4">
                    <span className="w-8 text-center">#</span>
                    <span>Title</span>
                    <span className="pr-4"><Clock size={16} /></span>
                </div>

                {tracks.map((track, i) => (
                    <div
                        key={`${track.id}-${i}`}
                        onClick={() => playTrack(track)}
                        className="group grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                    >
                        <span className="w-8 text-center text-slate-500 group-hover:text-white font-medium">
                            {currentTrack?.id === track.id && isPlaying ? (
                                <span className="w-4 h-4 inline-block animate-pulse bg-[#8B5CF6] rounded-full" />
                            ) : (
                                i + 1
                            )}
                        </span>

                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#111]">
                                <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className={`text-base font-medium truncate ${currentTrack?.id === track.id ? 'text-[#8B5CF6]' : 'text-white'}`}>
                                    {track.title}
                                </h4>
                                <p className="text-sm text-slate-400 truncate group-hover:text-slate-300">{track.artist}</p>
                            </div>
                        </div>

                        <div className="pr-4 text-sm text-slate-500 group-hover:text-white transition-colors">
                            {formatDuration(track.duration)}
                        </div>
                    </div>
                ))}

                {tracks.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        <Heart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Songs you like will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
