'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

import { useRouter } from 'next/navigation';
import { SearchBar } from './SearchBar';

export function Header() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Also check localStorage for local auth
    const [localUser, setLocalUser] = useState<{ name?: string; email?: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('streamflow_user');
            if (stored) {
                setLocalUser(JSON.parse(stored));
            }
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isLoggedIn = session || localUser;
    const userName = session?.user?.name || localUser?.name || 'User';
    const userImage = session?.user?.image;

    const handleSignOut = () => {
        // Clear local auth
        localStorage.removeItem('streamflow_user');
        document.cookie = 'streamflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        if (session) {
            signOut({ callbackUrl: '/login' });
        } else {
            window.location.href = '/login';
        }
    };

    return (
        <header className="sticky top-0 z-50 px-8 py-6 bg-[#0A0A0B]/60 backdrop-blur-2xl flex items-center justify-between border-b border-white/5 supports-[backdrop-filter]:bg-[#0A0A0B]/60">
            {/* Search Bar */}
            {/* Search Bar */}
            <SearchBar />

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#8B5CF6] rounded-full"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    {status === 'loading' ? (
                        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                    ) : isLoggedIn ? (
                        <>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-[#8B5CF6]/50 transition-all"
                            >
                                {userImage ? (
                                    <img
                                        src={userImage}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1d] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-white/5">
                                        <p className="text-white font-medium text-sm">{userName}</p>
                                        <p className="text-gray-500 text-xs truncate">
                                            {session?.user?.email || localUser?.email}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                router.push('/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm">Settings</span>
                                        </button>
                                    </div>

                                    {/* Sign Out */}
                                    <div className="py-2 border-t border-white/5">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="text-sm">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-gray-200 transition-colors"
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
        </header>
    );
}
