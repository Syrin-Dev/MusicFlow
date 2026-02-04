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
        <div suppressHydrationWarning className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0B] border-t border-white/5 z-40 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-[80px]">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-1 w-16"
                        >
                            <div
                                className={`
                                    w-16 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                    ${active ? 'bg-[#8B5CF6]/20' : 'bg-transparent'}
                                `}
                            >
                                <Icon
                                    size={24}
                                    className={`transition-colors duration-300 ${active ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                            </div>
                            <span
                                className={`
                                    text-[11px] font-medium transition-colors duration-300
                                    ${active ? 'text-white' : 'text-gray-500'}
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
