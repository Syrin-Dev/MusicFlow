'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Compass } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/explore', icon: Compass, label: 'Explore' },
        { href: '/search', icon: Search, label: 'Search' },
        { href: '/library', icon: Library, label: 'Library' },
    ];

    return (
        <div suppressHydrationWarning className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#0A0A0B]/80 backdrop-blur-3xl border border-white/10 z-[100] rounded-[2rem] shadow-2xl safe-area-inset-bottom">
            <div className="flex justify-around items-center h-[70px] px-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-1.5 flex-1 relative group"
                        >
                            <div
                                className={`
                                    relative w-12 h-12 flex items-center justify-center transition-all duration-500 rounded-2xl
                                    ${active ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}
                                `}
                            >
                                {active && (
                                    <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-in fade-in zoom-in-75 duration-300" />
                                )}
                                <Icon
                                    size={24}
                                    strokeWidth={active ? 2.5 : 2}
                                    className="relative z-10"
                                />
                            </div>
                            <span
                                className={`
                                    text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300
                                    ${active ? 'text-white opacity-100 translate-y-0' : 'text-zinc-500 opacity-60'}
                                `}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
