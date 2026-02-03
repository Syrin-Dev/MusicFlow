'use client';

import { useRouter } from 'next/navigation';
import { Play, ChevronLeft, Clock, Heart, Shuffle, User } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

export default function LikedSongsPage() {
    const router = useRouter();
    const { playTrack, currentTrack, isPlaying, addToQueue, likedSongs, playPlaylist } = useAudio();

    // Use likedSongs directly from context
    const tracks = likedSongs;

    const playAll = (shuffle = false) => {
        if (!tracks.length) return;

        let playQueue = [...tracks];
        if (shuffle) {
            playQueue = playQueue.sort(() => Math.random() - 0.5);
        }

        playPlaylist(playQueue, 0);
    };

    const formatDuration = (seconds?: string | number) => {
        if (!seconds) return '-';
        const sec = Number(seconds);
        if (isNaN(sec)) return seconds;

        const minutes = Math.floor(sec / 60);
        const remainingSeconds = sec % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

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
                    {/* Cover Art - Dynamic Collage */}
                    <div className="w-52 h-52 md:w-64 md:h-64 rounded-2xl shadow-2xl shadow-violet-900/20 overflow-hidden flex-shrink-0 bg-[#1A1A1E]">
                        {tracks.length > 0 ? (
                            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                {tracks.slice(0, 4).map((track, i) => (
                                    <div key={`${track.id}-${i}`} className="w-full h-full relative border-[0.5px] border-black/10">
                                        <img
                                            src={track.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLElement).parentElement!.style.background = 'linear-gradient(to bottom right, #7c3aed, #db2777)';
                                            }}
                                        />
                                    </div>
                                ))}
                                {/* Fill remaining slots if < 4 */}
                                {Array.from({ length: Math.max(0, 4 - tracks.slice(0, 4).length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-80"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600">
                                <Heart size={80} className="text-white" fill="white" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2 min-w-0">
                        <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Playlist</p>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 truncate shadow-lg tracking-tight">Liked Songs</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                <User size={12} />
                            </div>
                            <span className="font-semibold text-white">You</span>
                            <span>•</span>
                            <span>{tracks.length} songs</span>
                        </div>
                    </div>

                    {/* Play Buttons */}
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => playAll(false)}
                            className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-full p-4 shadow-xl hover:scale-105 transition-all shadow-violet-900/40"
                        >
                            <Play size={28} fill="currentColor" className="ml-1" />
                        </button>
                        <button
                            onClick={() => playAll(true)}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-md transition-all border border-white/5"
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
                        onClick={() => playPlaylist(tracks, i)}
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
                                <img
                                    src={track.thumbnail}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (img.src.includes('hqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
                                        } else {
                                            img.style.display = 'none';
                                            img.parentElement!.style.backgroundColor = '#27272a';
                                        }
                                    }}
                                />
                            </div>
                            <div className="min-w-0">
                                <h4 className={`text-base font-medium truncate ${currentTrack?.id === track.id ? 'text-[#8B5CF6]' : 'text-white'}`}>
                                    {track.title}
                                </h4>
                                <p className="text-sm text-slate-400 truncate group-hover:text-slate-300">{track.artist}</p>
                            </div>
                        </div>

                        <div className="pr-4 text-sm text-slate-500 group-hover:text-white transition-colors">
                            {formatDuration((track as any).duration)}
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
