'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Compass } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? 'text-white' : 'text-gray-500 hover:text-white';
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 z-40 px-6 py-4 pb-6">
            <div className="flex justify-between items-center">
                <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
                    <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link href="/explore" className={`flex flex-col items-center gap-1 ${isActive('/explore')}`}>
                    <Compass size={24} strokeWidth={isActive('/explore') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>

                <Link href="/search" className={`flex flex-col items-center gap-1 ${isActive('/search')}`}>
                    <Search size={24} strokeWidth={isActive('/search') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Search</span>
                </Link>

                <Link href="/library" className={`flex flex-col items-center gap-1 ${isActive('/library')}`}>
                    <Library size={24} strokeWidth={isActive('/library') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Library</span>
                </Link>
            </div>
        </div>
    );
}
