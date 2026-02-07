'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Music, Play, MoreHorizontal, Trash2, X, User, Clock, Pin } from 'lucide-react';
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
    _count: { tracks: number };
}

export default function LibraryPage() {
    const router = useRouter();
    const { likedSongs, playTrack, addToQueue } = useAudio();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'playlists' | 'liked'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const res = await fetch('/api/playlists');
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data);
            }
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
        }
        setLoading(false);
    };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim() || creating) return;

        setCreating(true);
        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPlaylistName })
            });

            if (res.ok) {
                const playlist = await res.json();
                setPlaylists(prev => [playlist, ...prev]);
                setNewPlaylistName('');
                setShowCreateModal(false);
                // Notify sidebar
                window.dispatchEvent(new CustomEvent('playlist-change'));
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to create playlist'}`);
            }
        } catch (error) {
            console.error('Failed to create playlist:', error);
            alert('Something went wrong. Please try again.');
        }
        setCreating(false);
    };

    const deletePlaylist = async (id: string) => {
        if (!confirm('Are you sure you want to delete this playlist?')) return;

        try {
            await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
            setPlaylists(prev => prev.filter(p => p.id !== id));
            // Notify sidebar
            window.dispatchEvent(new CustomEvent('playlist-change'));
        } catch (error) {
            console.error('Failed to delete playlist:', error);
        }
    };

    const playLikedSongs = () => {
        if (likedSongs.length > 0) {
            playTrack(likedSongs[0]);
            likedSongs.slice(1).forEach(song => addToQueue(song));
        }
    };

    const filteredItems = filter === 'liked' ? [] : playlists;
    const showLikedSongs = filter === 'all' || filter === 'liked';

    return (
        <div className="flex-1 overflow-y-auto bg-transparent pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-xl px-4 md:px-8 py-4 md:py-6 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-6">
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Library</h1>
                        {!loading && (
                            <div className="flex gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-l border-white/5 pl-4 hidden md:flex">
                                <span>{playlists.length} Playlists</span>
                                <span>•</span>
                                <span>{likedSongs.length} Liked Songs</span>
                            </div>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filter === 'all'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('playlists')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filter === 'playlists'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            Playlists
                        </button>
                        <button
                            onClick={() => setFilter('liked')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filter === 'liked'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                        >
                            Liked
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-8">
                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">

                    {/* Liked Songs Card - ENHANCED */}
                    {showLikedSongs && (
                        <div
                            className="group cursor-pointer"
                            onClick={() => router.push('/library/liked')}
                        >
                            <div className="aspect-square rounded-2xl bg-[#1A1A1E] relative overflow-hidden mb-3 shadow-lg group-hover:shadow-violet-900/20 transition-all duration-300">
                                {/* Dynamic Collage Background */}
                                {likedSongs.length > 0 ? (
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                        {likedSongs.slice(0, 4).map((song, i) => (
                                            <div key={song.id} className="relative w-full h-full">
                                                <img
                                                    src={song.thumbnail}
                                                    alt=""
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                                                />
                                            </div>
                                        ))}
                                        {/* Fill remaining with gradient if < 4 songs */}
                                        {Array.from({ length: Math.max(0, 4 - likedSongs.slice(0, 4).length) }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-full h-full bg-zinc-900/50"></div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 opacity-80"></div>
                                )}

                                {/* Overlay Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent ${likedSongs.length > 0 ? 'opacity-100' : 'opacity-50'}`}></div>

                                <div className="absolute top-4 right-4 text-white/30 group-hover:text-white/60 transition-colors z-10">
                                    <Heart size={28} fill="currentColor" />
                                </div>
                                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                                    <div className="mb-auto"></div> {/* Spacer */}
                                    {likedSongs.length === 0 && <Heart size={48} className="text-white mb-2" fill="white" />}

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playLikedSongs();
                                            }}
                                            className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-violet-600 shadow-xl transform scale-90 group-hover:scale-100 transition-transform hover:scale-105 active:scale-95"
                                        >
                                            <Play size={28} fill="currentColor" className="ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-white truncate text-lg">Liked Songs</h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                <Pin size={12} className="text-violet-500 rotate-45" />
                                {likedSongs.length} songs • Auto-playlist
                            </p>
                        </div>
                    )}

                    {/* Create Playlist Button - ENHANCED */}
                    {filter !== 'liked' && (
                        <div
                            className="group cursor-pointer"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <div className="aspect-square rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center mb-3 group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg group-hover:shadow-violet-900/10">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <Plus size={32} className="text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-sm text-slate-400 group-hover:text-white transition-colors font-bold tracking-wide">NEW PLAYLIST</span>
                            </div>
                            <h3 className="font-bold text-slate-500 truncate group-hover:text-white transition-colors">Create Playlist</h3>
                        </div>
                    )}

                    {/* User Playlists */}
                    {filteredItems.map(playlist => (
                        <div
                            key={playlist.id}
                            className="group cursor-pointer relative"
                        >
                            <div
                                className="aspect-square rounded-2xl overflow-hidden relative mb-3 bg-[#1A1A1E] shadow-lg ring-1 ring-white/5 group-hover:ring-white/10 transition-all"
                                onClick={() => router.push(`/library/playlist/${playlist.id}`)}
                            >
                                {playlist.thumbnail ? (
                                    <img
                                        src={playlist.thumbnail}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5">
                                        <Music size={48} className="text-white/10 group-hover:text-white/30 transition-colors" />
                                    </div>
                                )}

                                {/* Hover Play Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
                                        <Play size={28} fill="currentColor" className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deletePlaylist(playlist.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white text-zinc-400 backdrop-blur-md"
                            >
                                <Trash2 size={16} />
                            </button>

                            <h3 className="font-bold text-white truncate text-lg group-hover:text-violet-400 transition-colors">{playlist.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                {playlist._count?.tracks || 0} songs • Playlist
                            </p>
                        </div>
                    ))}
                </div>

                {/* Liked Songs List (when filtered) */}
                {filter === 'liked' && likedSongs.length > 0 && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-white mb-4">All Liked Songs</h2>
                        <div className="space-y-2">
                            {likedSongs.map((song, index) => (
                                <div
                                    key={song.id}
                                    className="group flex items-center gap-4 p-3 rounded-xl bg-[#1A1A1E]/50 hover:bg-[#1A1A1E] transition-all cursor-pointer border border-transparent hover:border-white/5"
                                    onClick={() => playTrack(song)}
                                >
                                    <span className="w-8 text-center text-sm text-slate-500 group-hover:hidden font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="w-8 text-center hidden group-hover:flex items-center justify-center">
                                        <Play size={16} className="text-white" fill="white" />
                                    </span>
                                    <img
                                        src={song.thumbnail}
                                        alt={song.title}
                                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate group-hover:text-violet-400 transition-colors">{song.title}</h4>
                                        <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                                    </div>
                                    <Heart size={18} className="text-violet-500" fill="currentColor" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filter === 'playlists' && playlists.length === 0 && (
                    <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Music size={40} className="text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first playlist to organize your music and share it with friends.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors"
                        >
                            Create Playlist
                        </button>
                    </div>
                )}
            </div>

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1A1A1E] rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/10 transform transition-all scale-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white tracking-tight">Create Playlist</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="My awesome playlist..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                            className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors mb-8"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-4 bg-transparent border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createPlaylist}
                                disabled={!newPlaylistName.trim() || creating}
                                className="flex-1 px-4 py-4 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20"
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
