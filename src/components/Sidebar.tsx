'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
    Home, Compass, Library, Heart, ListMusic, Pin, User, Sparkles
} from 'lucide-react';

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userName = session?.user?.name || 'Guest';
    const [playlists, setPlaylists] = useState<any[]>([]);

    useEffect(() => {
        const fetchPlaylists = () => {
            // Add timestamp to prevent caching
            fetch(`/api/playlists?t=${Date.now()}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPlaylists(data);
                    } else {
                        // Silent fail or default empty array
                        setPlaylists([]);
                    }
                })
                .catch(console.error);
        };

        // Fetch immediately and listen for changes
        fetchPlaylists();
        window.addEventListener('playlist-change', fetchPlaylists);

        return () => window.removeEventListener('playlist-change', fetchPlaylists);
    }, []); // Removed session dependency to ensure it runs

    const isActive = (path: string) => pathname === path;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
        <Link
            href={href}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 border
                ${isActive(href)
                    ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }
            `}
        >
            <Icon size={22} className={isActive(href) ? 'text-[#8B5CF6]' : 'text-current'} />
            {label}
        </Link>
    );

    return (
        <aside className="w-64 h-full flex flex-col p-6 bg-[#0A0A0B] border-r border-white/5 z-20 fixed left-0 top-0">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                    <span className="font-bold text-lg">S</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    StreamFlow
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col overflow-hidden">
                <div className="space-y-2 flex-shrink-0">
                    <NavItem href="/" icon={Home} label="Home" />
                    <NavItem href="/for-you" icon={Sparkles} label="For You" />
                    <NavItem href="/explore" icon={Compass} label="Explore" />
                    <NavItem href="/library" icon={Library} label="Library" />
                </div>

                {/* Playlist Section Header */}
                <div className="flex-shrink-0 mt-6 mb-2 px-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Collection</span>
                </div>

                {/* Playlist Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                    {/* Liked Songs - Pinned Effect */}
                    <Link
                        href="/library/liked"
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                            ${isActive('/library/liked') ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <div className={`p-1.5 rounded-lg ${isActive('/library/liked') ? 'bg-[#8B5CF6]/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <Heart size={16} className={`fill-current ${isActive('/library/liked') ? 'text-[#8B5CF6]' : 'text-slate-500 group-hover:text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive('/library/liked') ? 'text-white' : ''}`}>Liked Songs</p>
                            <div className="flex items-center gap-1.5">
                                <Pin size={10} className="text-[#8B5CF6] rotate-45" />
                                <span className="text-[10px] text-slate-500">Auto playlist</span>
                            </div>
                        </div>
                    </Link>

                    {/* User Playlists */}
                    {playlists.map((playlist) => (
                        <Link
                            key={playlist.id}
                            href={`/playlist/${playlist.id}`}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                ${isActive(`/playlist/${playlist.id}`) ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <div className={`p-1.5 rounded-lg ${isActive(`/playlist/${playlist.id}`) ? 'bg-[#8B5CF6]/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <ListMusic size={16} className={isActive(`/playlist/${playlist.id}`) ? 'text-[#8B5CF6]' : 'text-slate-500 group-hover:text-white'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive(`/playlist/${playlist.id}`) ? 'text-white' : ''}`}>{playlist.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">By {userName.split(' ')[0]}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </nav>
        </aside>
    );
}
