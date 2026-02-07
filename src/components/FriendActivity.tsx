'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from './AudioProvider';
import { Play } from 'lucide-react';

interface Friend {
    id: string;
    name: string;
    image: string;
    status: string;
    lastTrack?: {
        videoId: string;
        title: string;
        artist: string;
        thumbnail: string;
    } | null;
}

export function FriendActivity() {
    const { data: session } = useSession();
    const { playTrack, openConnect } = useAudio();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!session) return;
            try {
                const res = await fetch('/api/user/friends');
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter friends who actually have a lastTrack
                    setFriends(data.filter(f => f.lastTrack).slice(0, 4));
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };

        fetchActivity();
        const interval = setInterval(fetchActivity, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [session]);

    if (!session || (friends.length === 0 && !loading)) return null;

    return (
        <section className="animate-in fade-in duration-1000">
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Social Feed</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-0.5">Live from your circle</p>
                </div>
                <button
                    onClick={() => openConnect(null)}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                >
                    View All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-3xl p-5 border border-white/5 animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                <div className="h-4 bg-white/5 rounded w-24"></div>
                            </div>
                            <div className="aspect-square bg-white/5 rounded-2xl"></div>
                        </div>
                    ))
                ) : (
                    friends.map((friend) => (
                        <div key={friend.id} className="group relative bg-[#18181b]/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/5 hover:bg-white/5 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                            {/* Friend Info Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative">
                                    <img
                                        src={friend.image || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                                        alt={friend.name}
                                    />
                                    {friend.status === 'Online' && (
                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#121214]"></span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{friend.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                        {friend.status === 'Online' ? 'Listening now' : 'Recently played'}
                                    </p>
                                </div>
                            </div>

                            {/* Track Artwork with Play Button */}
                            <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 shadow-2xl group/art">
                                <img
                                    src={friend.lastTrack?.thumbnail}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-110"
                                    alt=""
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (img.src.includes('hqdefault')) {
                                            img.src = `https://i.ytimg.com/vi/${friend.lastTrack?.videoId}/mqdefault.jpg`;
                                        } else {
                                            img.style.display = 'none';
                                            img.parentElement!.style.background = 'linear-gradient(to bottom right, #6B21A8, #8b5cf6)';
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <button
                                        onClick={() => playTrack({
                                            id: friend.lastTrack!.videoId,
                                            title: friend.lastTrack!.title,
                                            artist: friend.lastTrack!.artist,
                                            thumbnail: friend.lastTrack!.thumbnail
                                        })}
                                        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover/art:scale-100 transition-transform duration-300"
                                    >
                                        <Play size={24} fill="currentColor" className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Track Metadata */}
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => openConnect(null)}>
                                    {friend.lastTrack?.title}
                                </h4>
                                <p className="text-xs text-zinc-500 truncate">{friend.lastTrack?.artist}</p>
                            </div>

                            {/* Conversation Trigger */}
                            <button
                                onClick={() => openConnect(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                            >
                                <span className="material-icons-round text-lg">chat</span>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
