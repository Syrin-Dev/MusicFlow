'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { Bell, User, Settings, LogOut, Users, Menu } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

export function Header() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { openConnect } = useAudio();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isLoggedIn = !!session;
    const userName = session?.user?.name || 'User';
    const userImage = session?.user?.image;

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        // Glassmorphism update: Added glass-panel like styles directly or via class
        <header className="sticky top-0 z-40 px-6 py-4 transition-all duration-300 border-x-0 border-t-0 backdrop-blur-md bg-black/10 border-b border-white/5">
            <div suppressHydrationWarning className="flex items-center justify-between max-w-7xl mx-auto w-full">

                {/* Search Bar Container */}
                <div className="flex-1 max-w-xl flex items-center gap-4">
                    <span className="hidden lg:block text-zinc-400 font-medium text-sm whitespace-nowrap drop-shadow-md">
                        {getGreeting()}, {userName.split(' ')[0]}
                    </span>
                    <SearchBar />
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 md:gap-4 pl-4">

                    {/* Activity Button (Desktop) */}
                    <button
                        onClick={() => openConnect(null)}
                        className="hidden md:flex p-2.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300 group"
                        title="Friend Activity"
                    >
                        <Users size={20} className="group-hover:scale-110 transition-transform group-hover:text-[#8B5CF6] group-hover:drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
                    </button>

                    {/* Notifications */}
                    <NotificationsDropdown />

                    <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        {status === 'loading' ? (
                            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                        ) : isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#8B5CF6]/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    {userImage ? (
                                        <img
                                            src={userImage}
                                            alt={userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6] to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 glass-panel bg-[#0d0d0f]/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <p className="text-white font-semibold text-sm">{userName}</p>
                                            <p className="text-zinc-500 text-xs truncate mt-0.5">
                                                {session?.user?.email}
                                            </p>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    router.push('/settings');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left text-sm"
                                            >
                                                <User size={16} />
                                                <span>Profile</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    router.push('/settings');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left text-sm"
                                            >
                                                <Settings size={16} />
                                                <span>Settings</span>
                                            </button>
                                        </div>

                                        <div className="p-2 border-t border-white/5 bg-red-500/5">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-left text-sm"
                                            >
                                                <LogOut size={16} />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-white/10"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
