'use client';

import { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NavItem = ({ href, icon: Icon, label }: { href: string; icon: ElementType; label: string }) => {
    const pathname = usePathname();
    const active = pathname === href;
    return (
        <Link
            href={href}
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
