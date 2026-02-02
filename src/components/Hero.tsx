'use client';

import { Play } from 'lucide-react';

export function Hero() {
    return (
        <div className="relative w-full h-[300px] rounded-3xl overflow-hidden mb-8 group">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 opacity-80 group-hover:scale-105 transition-transform duration-700"></div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-secondary tracking-widest text-xs font-bold uppercase mb-2 text-pink-400">Featured Playlist</span>
                <h2 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-xl">
                    Sunset Waves & <br /> Good Vibes
                </h2>
                <p className="text-gray-300 max-w-lg mb-6 line-clamp-2">
                    Experience the ultimate chill collection. curated for late night drives and deep focus sessions.
                    Lossless quality available.
                </p>

                <div className="flex gap-4">
                    <button className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors">
                        <Play size={20} fill="black" /> Play Now
                    </button>
                    <button className="px-8 py-3 rounded-full font-bold border border-white/20 hover:bg-white/10 transition-colors backdrop-blur-md">
                        Save for Later
                    </button>
                </div>
            </div>
        </div>
    );
}
