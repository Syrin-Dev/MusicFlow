'use client';

export const GENRES = [
    { label: 'All', value: 'all' },
    { label: 'Relax', value: 'relax music' },
    { label: 'Energize', value: 'workout music' },
    { label: 'Commute', value: 'commute podcast' },
    { label: 'Romance', value: 'love songs' },
    { label: 'Focus', value: 'focus music' },
    { label: 'Party', value: 'party music' },
    { label: 'Sad', value: 'sad songs' },
    { label: 'Sleep', value: 'sleep music' },
];

interface GenreBubblesProps {
    onGenreSelect?: (genre: string, value: string) => void;
    selectedGenre?: string;
}

export function GenreBubbles({ onGenreSelect, selectedGenre = 'All' }: GenreBubblesProps) {

    return (
        // Removed dark background/gradient and backdrop blur from container
        <div className="sticky top-[72px] z-30 -mb-2">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-8 py-4">
                {/* Added px-1 to avoid clipping active shadow */}
                <div className="px-1 flex gap-3">
                    {GENRES.map((genre) => (
                        <button
                            key={genre.label}
                            onClick={() => onGenreSelect && onGenreSelect(genre.label, genre.value)}
                            className={`
                            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border
                            ${selectedGenre === genre.label
                                    // Active State: Purple glow, border, and text instead of solid white
                                    ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-105'
                                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white backdrop-blur-md'}
                        `}
                        >
                            {genre.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
