'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Music, Play, MoreHorizontal, Trash2, X, User, Clock } from 'lucide-react';
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
        <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0A0A0B]/90 backdrop-blur-xl px-8 py-6 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <h1 className="text-3xl font-bold text-white">Library</h1>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-violet-600 text-white'
                                : 'bg-[#1A1A1E] text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            All Items
                        </button>
                        <button
                            onClick={() => setFilter('playlists')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'playlists'
                                ? 'bg-violet-600 text-white'
                                : 'bg-[#1A1A1E] text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            Playlists
                        </button>
                        <button
                            onClick={() => setFilter('liked')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'liked'
                                ? 'bg-violet-600 text-white'
                                : 'bg-[#1A1A1E] text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            Liked Songs
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                    {/* Liked Songs Card */}
                    {showLikedSongs && (
                        <div
                            className="group cursor-pointer"
                            onClick={() => router.push('/library/liked')}
                        >
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 p-6 flex flex-col justify-end relative overflow-hidden mb-3 shadow-lg">
                                <div className="absolute top-4 right-4 text-white/30 group-hover:text-white/60 transition-colors">
                                    <Heart size={32} fill="currentColor" />
                                </div>
                                <div className="relative z-10">
                                    <Heart size={48} className="text-white mb-2" fill="white" />
                                </div>
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playLikedSongs();
                                        }}
                                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-violet-600 shadow-xl transform scale-90 group-hover:scale-100 transition-transform"
                                    >
                                        <Play size={28} fill="currentColor" className="ml-1" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-white truncate">Liked Songs</h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Music size={12} />
                                {likedSongs.length} songs
                            </p>
                        </div>
                    )}

                    {/* Create Playlist Button */}
                    {filter !== 'liked' && (
                        <div
                            className="group cursor-pointer"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center mb-3 hover:border-violet-500 hover:bg-violet-500/5 transition-all">
                                <Plus size={48} className="text-slate-500 group-hover:text-violet-500 transition-colors mb-2" />
                                <span className="text-sm text-slate-500 group-hover:text-violet-500 transition-colors font-medium">New Playlist</span>
                            </div>
                            <h3 className="font-bold text-slate-500 truncate">Create Playlist</h3>
                            <p className="text-xs text-slate-600 mt-1">Add your favorite songs</p>
                        </div>
                    )}

                    {/* User Playlists */}
                    {filteredItems.map(playlist => (
                        <div
                            key={playlist.id}
                            className="group cursor-pointer relative"
                        >
                            <div
                                className="aspect-square rounded-2xl overflow-hidden relative mb-3 bg-[#1A1A1E] shadow-lg"
                                onClick={() => router.push(`/library/playlist/${playlist.id}`)}
                            >
                                {playlist.thumbnail ? (
                                    <img
                                        src={playlist.thumbnail}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                        <Music size={48} className="text-slate-600" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl">
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
                                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <Trash2 size={16} className="text-white" />
                            </button>

                            <h3 className="font-bold text-white truncate">{playlist.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Playlist • {playlist._count?.tracks || 0} songs
                            </p>
                        </div>
                    ))}
                </div>

                {/* Liked Songs List (when filtered) */}
                {filter === 'liked' && likedSongs.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-white mb-4">All Liked Songs</h2>
                        <div className="space-y-2">
                            {likedSongs.map((song, index) => (
                                <div
                                    key={song.id}
                                    className="group flex items-center gap-4 p-3 rounded-xl bg-[#1A1A1E]/50 hover:bg-[#1A1A1E] transition-all cursor-pointer"
                                    onClick={() => playTrack(song)}
                                >
                                    <span className="w-8 text-center text-sm text-slate-500 group-hover:hidden">
                                        {index + 1}
                                    </span>
                                    <span className="w-8 text-center hidden group-hover:flex items-center justify-center">
                                        <Play size={16} className="text-white" fill="white" />
                                    </span>
                                    <img
                                        src={song.thumbnail}
                                        alt={song.title}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium truncate">{song.title}</h4>
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
                    <div className="text-center py-20">
                        <Music size={64} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
                        <p className="text-slate-400 mb-6">Create your first playlist to organize your music</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-violet-600 text-white rounded-full font-medium hover:bg-violet-500 transition-colors"
                        >
                            Create Playlist
                        </button>
                    </div>
                )}
            </div>

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1A1A1E] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create Playlist</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="My awesome playlist..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                            className="w-full px-4 py-3 bg-[#0A0A0B] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                            autoFocus
                        />

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createPlaylist}
                                disabled={!newPlaylistName.trim() || creating}
                                className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
