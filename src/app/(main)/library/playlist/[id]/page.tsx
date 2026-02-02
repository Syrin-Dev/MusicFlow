'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, ArrowLeft, Clock, MoreHorizontal, Trash2, Music, Shuffle } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

interface Track {
    id: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
}

interface Playlist {
    id: string;
    name: string;
    thumbnail: string | null;
    createdAt: string;
    tracks: Track[];
    user: { name: string };
}

export default function PlaylistDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { playTrack, addToQueue } = useAudio();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchPlaylist(params.id as string);
        }
    }, [params.id]);

    const fetchPlaylist = async (id: string) => {
        try {
            const res = await fetch(`/api/playlists/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPlaylist(data);
            }
        } catch (error) {
            console.error('Failed to fetch playlist:', error);
        }
        setLoading(false);
    };

    const playAll = (shuffle = false) => {
        if (!playlist?.tracks.length) return;

        let tracks = [...playlist.tracks];
        if (shuffle) {
            tracks = tracks.sort(() => Math.random() - 0.5);
        }

        playTrack({
            id: tracks[0].videoId,
            title: tracks[0].title,
            artist: tracks[0].artist,
            thumbnail: tracks[0].thumbnail
        });

        tracks.slice(1).forEach(track => addToQueue({
            id: track.videoId,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail
        }));
    };

    const removeTrack = async (trackId: string) => {
        // Would need an endpoint for this
        // For now, just remove from UI
        if (playlist) {
            setPlaylist({
                ...playlist,
                tracks: playlist.tracks.filter(t => t.id !== trackId)
            });
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">
                <div className="p-8 animate-pulse">
                    <div className="flex gap-8 mb-8">
                        <div className="w-64 h-64 bg-[#1A1A1E] rounded-2xl" />
                        <div className="flex-1">
                            <div className="h-8 bg-[#1A1A1E] rounded w-48 mb-4" />
                            <div className="h-6 bg-[#1A1A1E] rounded w-32" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0A0A0B]">
                <div className="text-center">
                    <Music size={64} className="mx-auto text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Playlist not found</h2>
                    <button
                        onClick={() => router.push('/library')}
                        className="text-violet-500 hover:text-violet-400"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-900/30 to-[#0A0A0B]" />

                <div className="relative p-8">
                    <button
                        onClick={() => router.push('/library')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Library</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Playlist Cover */}
                        <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                            {playlist.thumbnail ? (
                                <img
                                    src={playlist.thumbnail}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600">
                                    <Music size={80} className="text-white/50" />
                                </div>
                            )}
                        </div>

                        {/* Playlist Info */}
                        <div className="flex flex-col justify-end">
                            <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Playlist</p>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{playlist.name}</h1>
                            <p className="text-slate-400">
                                {playlist.user?.name || 'You'} • {playlist.tracks.length} songs
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 mt-6">
                                <button
                                    onClick={() => playAll()}
                                    disabled={!playlist.tracks.length}
                                    className="flex items-center gap-2 px-8 py-3 bg-violet-600 text-white rounded-full font-bold hover:bg-violet-500 transition-colors disabled:opacity-50"
                                >
                                    <Play size={20} fill="currentColor" />
                                    Play
                                </button>
                                <button
                                    onClick={() => playAll(true)}
                                    disabled={!playlist.tracks.length}
                                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                                >
                                    <Shuffle size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tracks List */}
            <div className="px-8">
                {playlist.tracks.length === 0 ? (
                    <div className="text-center py-16">
                        <Music size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No songs yet</h3>
                        <p className="text-slate-400">Add songs from search or recommendations</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Header */}
                        <div className="grid grid-cols-[40px_1fr_200px_80px] gap-4 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <span>#</span>
                            <span>Title</span>
                            <span>Artist</span>
                            <span className="text-right"><Clock size={14} /></span>
                        </div>

                        {/* Tracks */}
                        {playlist.tracks.map((track, index) => (
                            <div
                                key={track.id}
                                className="group grid grid-cols-[40px_1fr_200px_80px] gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => playTrack({
                                    id: track.videoId,
                                    title: track.title,
                                    artist: track.artist,
                                    thumbnail: track.thumbnail
                                })}
                            >
                                <span className="flex items-center justify-center text-slate-500 group-hover:hidden">
                                    {index + 1}
                                </span>
                                <span className="hidden group-hover:flex items-center justify-center">
                                    <Play size={14} className="text-white" fill="white" />
                                </span>

                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={track.thumbnail}
                                        alt={track.title}
                                        className="w-10 h-10 rounded object-cover"
                                    />
                                    <span className="text-white font-medium truncate">{track.title}</span>
                                </div>

                                <span className="flex items-center text-slate-400 truncate">{track.artist}</span>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTrack(track.id);
                                        }}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <span className="text-sm text-slate-500">3:30</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
