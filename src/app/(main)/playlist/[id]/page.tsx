'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, ChevronLeft, Clock, MoreHorizontal, Shuffle, Heart } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
}

interface PlaylistData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    tracks: Track[];
}

export default function PlaylistPage() {
    const params = useParams();
    const router = useRouter();
    const { playTrack, currentTrack, isPlaying } = useAudio();
    const playlistId = params?.id as string;

    const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!playlistId) return;

        fetch(`/api/playlist/${playlistId}`)
            .then(res => res.json())
            .then(async (data) => {
                if (data.error) {
                    // Fallback: Check if it's a local playlist (due to incorrect navigation/links)
                    try {
                        const localRes = await fetch(`/api/playlists/${playlistId}`);
                        if (localRes.ok) {
                            // It exists locally! Redirect.
                            console.log("Redirecting to local playlist...");
                            router.replace(`/library/playlist/${playlistId}`);
                            return;
                        }
                    } catch (e) { /* ignore */ }

                    console.error("Playlist API Error:", data.error);
                } else {
                    setPlaylist(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [playlistId, router]);

    const playAll = () => {
        if (playlist?.tracks?.length) {
            playTrack(playlist.tracks[0]);
        }
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
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    if (!playlist) return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
            Playlist not found or failed to load.
        </div>
    );

    const tracks = playlist.tracks || [];

    return (
        <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-32">

            {/* Header */}
            <div className="relative h-[40vh] md:h-[45vh] min-h-[350px] flex flex-col justify-between p-4 md:p-8 bg-gradient-to-b from-slate-800 to-[#0A0A0B]">
                <div className="w-full z-20">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-colors border border-white/5"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 z-10 w-full text-center md:text-left">
                    {/* Cover Art */}
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex-shrink-0">
                        <img src={playlist.thumbnail} alt={playlist.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2 min-w-0">
                        <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white/60 mb-2">Playlist</p>
                        <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight line-clamp-2">
                            {playlist.title}
                        </h1>
                        <p className="text-sm md:text-base text-white/40 line-clamp-2 max-w-2xl mb-4 font-bold">
                            {playlist.description || `Curated by ${playlist.channelTitle}`}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-sm text-white/30 font-black uppercase tracking-widest">
                            <span className="text-white hover:underline cursor-pointer">{playlist.channelTitle}</span>
                            <span>•</span>
                            <span>{tracks.length} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 md:px-8 py-6 flex items-center gap-4 sticky top-0 bg-[#0A0A0B]/95 backdrop-blur-xl z-30 border-b border-white/5">
                <button
                    onClick={playAll}
                    disabled={tracks.length === 0}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={24} fill="currentColor" className="ml-1" />
                </button>
                <div className="flex gap-2">
                    <button className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
                        <Heart size={24} />
                    </button>
                    <button className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
                        <MoreHorizontal size={24} />
                    </button>
                </div>
            </div>

            {/* Tracks List */}
            <div className="px-2 md:px-8 pb-12">
                <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-sm text-slate-500 font-medium border-b border-white/5 mb-2">
                    <span className="w-8 text-center">#</span>
                    <span>Title</span>
                    <span className="pr-4"><Clock size={16} /></span>
                </div>

                {tracks.map((track, i) => (
                    <div
                        key={`${track.id}-${i}`}
                        onClick={() => playTrack(track)}
                        className="group flex md:grid md:grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                    >
                        <span className="w-4 md:w-8 text-center text-xs md:text-sm text-slate-500 group-hover:text-white font-black">
                            {currentTrack?.id === track.id && isPlaying ? (
                                <span className="w-3 h-3 md:w-4 md:h-4 inline-block animate-pulse bg-primary rounded-full" />
                            ) : (
                                i + 1
                            )}
                        </span>

                        <div className="flex-1 md:flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#111] shadow-lg">
                                <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 ml-3 md:ml-0">
                                <h4 className={`text-sm md:text-base font-bold truncate ${currentTrack?.id === track.id ? 'text-primary' : 'text-white'}`}>
                                    {track.title}
                                </h4>
                                <p className="text-xs md:text-sm text-zinc-500 truncate group-hover:text-zinc-400 font-medium">{track.artist}</p>
                            </div>
                        </div>

                        <div className="hidden md:block pr-4 text-sm text-slate-500 group-hover:text-white transition-colors">
                            {formatDuration(track.duration)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
