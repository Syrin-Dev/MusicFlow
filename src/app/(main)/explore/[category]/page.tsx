'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, ChevronLeft, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

interface Song {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    type?: string;
}

export default function GenrePage() {
    const params = useParams();
    const router = useRouter();
    const { playTrack, currentTrack, isPlaying } = useAudio();
    const categoryRaw = params?.category as string;

    // Capitalize: rock -> Rock, k-pop -> K-Pop
    const categoryName = categoryRaw
        ? categoryRaw.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'Genre';

    const [songs, setSongs] = useState<Song[]>([]);
    const [playlists, setPlaylists] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryRaw) return;
        setLoading(true);

        const fetchContent = async () => {
            try {
                // Fetch Songs
                const songsRes = await fetch(`/api/search?q=Top ${encodeURIComponent(categoryName)} Songs Hit&type=video`);
                const songsData = await songsRes.json();
                setSongs(songsData.slice(0, 10));

                // Fetch Playlists
                const playlistsRes = await fetch(`/api/search?q=Top ${encodeURIComponent(categoryName)} Playlist 2025&type=playlist`);
                const playlistsData = await playlistsRes.json();
                setPlaylists(playlistsData.slice(0, 6));

                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };

        fetchContent();
    }, [categoryRaw, categoryName]);

    // Gradient map based on category
    const getGradient = (str: string) => {
        const colors = [
            'from-red-600 to-orange-800',
            'from-violet-600 to-indigo-900',
            'from-blue-600 to-cyan-800',
            'from-pink-600 to-rose-900',
            'from-emerald-600 to-teal-900',
        ];
        const index = str.length % colors.length;
        return colors[index];
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

    return (
        <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-32">

            {/* Hero Header */}
            <div className={`relative h-[40vh] min-h-[300px] flex flex-col justify-end p-8 bg-gradient-to-b ${getGradient(categoryName)}`}>
                <button
                    onClick={() => router.back()}
                    className="absolute top-8 left-8 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-colors border border-white/5"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex items-end gap-6 z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="w-48 h-48 md:w-52 md:h-52 rounded-2xl shadow-2xl overflow-hidden bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <span className="text-6xl filter drop-shadow-lg">{categoryName.charAt(0)}</span>
                    </div>
                    <div className="mb-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2 shadow-black drop-shadow-md">Editor's Picks</p>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-xl">{categoryName}</h1>
                        <p className="text-lg text-white/90 mt-4 max-w-2xl font-medium drop-shadow-md">
                            The hottest {categoryName} hits curated just for you. Updated daily.
                        </p>
                    </div>
                </div>

                {/* Gradient fade to black at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0B] to-transparent pointer-events-none"></div>
            </div>

            {/* Content Actions */}
            <div className="px-8 py-6 flex items-center gap-6 sticky top-0 bg-[#0A0A0B]/90 backdrop-blur-xl z-30 border-b border-white/5">
                <button
                    onClick={() => songs[0] && playTrack(songs[0])}
                    className="w-14 h-14 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-105 transition-transform"
                >
                    <Play size={28} fill="currentColor" className="ml-1" />
                </button>
                <div className="flex gap-2">
                    <button className="px-6 py-2 rounded-full border border-white/10 font-bold hover:bg-white/10 transition-colors text-white">
                        Save Genre
                    </button>
                </div>
            </div>

            {/* Song List */}
            <div className="px-8 space-y-1 mb-12 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Top Tracks</h3>
                </div>

                {songs.map((track, i) => (
                    <div
                        key={`${track.id}-${i}`}
                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                        onClick={() => playTrack(track)}
                    >
                        <span className="w-8 text-center text-slate-500 group-hover:text-white font-medium">{i + 1}</span>

                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#111]">
                            <img src={track.thumbnail} className="w-full h-full object-cover" alt="" />
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${currentTrack?.id === track.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <Play size={16} fill="white" className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className={`text-base font-medium truncate ${currentTrack?.id === track.id ? 'text-[#8B5CF6]' : 'text-white'}`}>
                                {track.title}
                            </h4>
                            <p className="text-sm text-slate-400">{track.artist}</p>
                        </div>

                        <button className="p-2 text-slate-500 hover:text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Heart size={18} />
                        </button>
                        <div className="text-sm text-slate-500 tabular-nums pr-4 flex items-center gap-2">
                            <span className="hidden sm:inline">3:45</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Playlists Section - ACTUAL PLAYLISTS with Navigation */}
            <div className="px-8 mb-12">
                <h3 className="text-xl font-bold mb-6 text-white">Popular Playlists</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {playlists.map((pl, i) => (
                        <div
                            key={i}
                            className="group cursor-pointer"
                            onClick={() => router.push(`/playlist/${pl.id}`)} // Navigate to Playlist Page
                        >
                            <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden mb-4 relative shadow-lg bg-[#111]">
                                <img src={pl.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                        Open
                                    </span>
                                </div>
                            </div>
                            <h4 className="font-bold truncate text-white group-hover:underline decoration-white/30 text-sm">{pl.title}</h4>
                            <p className="text-xs text-slate-400 truncate">Playlist • Hievly</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
