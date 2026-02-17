'use client';

import { useState, useEffect, ElementType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Compass, Library, Heart, ListMusic, Pin, Sparkles
} from 'lucide-react';

const NavItem = ({ href, icon: Icon, label }: { href: string; icon: ElementType; label: string }) => {
    const pathname = usePathname();
    const router = useRouter();
    const active = pathname === href;
    return (
        <Link
            href={href}
            onMouseEnter={() => router.prefetch(href)}
            className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden
                ${active
                    ? 'text-white bg-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }
            `}
        >
            {active && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent" />
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]" />
                </>
            )}
            <Icon size={20} className={`relative z-10 transition-colors ${active ? 'text-[#8B5CF6] drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'group-hover:text-purple-300'}`} />
            <span className="relative z-10">{label}</span>
        </Link>
    );
};

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchPlaylists = () => {
            fetch(`/api/playlists?t=${Date.now()}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPlaylists(data);
                    } else {
                        setPlaylists([]);
                    }
                })
                .catch(console.error);
        };

        fetchPlaylists();
        window.addEventListener('playlist-change', fetchPlaylists);

        return () => window.removeEventListener('playlist-change', fetchPlaylists);
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        // Glassmorphism update: Added backdrop-blur-md, bg-black/20, and border-white/5
        <aside suppressHydrationWarning className="w-64 h-full flex flex-col p-4 backdrop-blur-md bg-black/20 border-r border-white/5 z-50 fixed left-0 top-0 shadow-2xl">
            {/* Logo */}
            <div suppressHydrationWarning className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div suppressHydrationWarning className="relative w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                    <img
                        src="/logo.png"
                        alt="Hievly"
                        className="w-full h-full object-contain scale-[3.2] transition-transform brightness-110 filter invert-[1] hue-rotate-[180deg] drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]"
                    />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Hievly
                    </h1>
                    <p className="text-[10px] text-[#8B5CF6] uppercase tracking-widest font-bold drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]">Premium</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col overflow-hidden gap-6">
                <div suppressHydrationWarning className="space-y-1">
                    <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Menu</p>
                    <NavItem href="/" icon={Home} label="Home" />
                    <NavItem href="/for-you" icon={Sparkles} label="For You" />
                    <NavItem href="/explore" icon={Compass} label="Explore" />
                    <NavItem href="/library" icon={Library} label="Library" />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div suppressHydrationWarning className="flex items-center justify-between px-4 mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Your Collection</span>
                        <ListMusic size={12} className="text-zinc-600" />
                    </div>

                    {/* Playlist Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                        {/* Liked Songs - Pinned Effect */}
                        <Link
                            href="/library/liked"
                            onMouseEnter={() => router.prefetch('/library/liked')}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden border border-transparent
                                ${isActive('/library/liked') ? 'bg-gradient-to-r from-purple-500/10 to-transparent border-white/5' : 'hover:bg-white/5'}
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg
                                ${isActive('/library/liked')
                                    ? 'bg-gradient-to-br from-[#8B5CF6] to-fuchsia-600 shadow-purple-500/40 text-white'
                                    : 'bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700'}
                            `}>
                                <Heart size={14} fill={isActive('/library/liked') ? "currentColor" : "none"} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive('/library/liked') ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Liked Songs</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Pin size={10} className="text-[#8B5CF6] rotate-45" />
                                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">Pinned</span>
                                </div>
                            </div>
                        </Link>

                        {/* User Playlists */}
                        {playlists.map((playlist) => (
                            <Link
                                key={playlist.id}
                                href={`/library/playlist/${playlist.id}`}
                                onMouseEnter={() => router.prefetch(`/library/playlist/${playlist.id}`)}
                                className={`
                                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive(`/library/playlist/${playlist.id}`) ? 'text-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <ListMusic size={14} className={isActive(`/library/playlist/${playlist.id}`) ? 'text-[#8B5CF6]' : 'text-zinc-600 group-hover:text-zinc-400'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{playlist.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>
        </aside>
    );
}
