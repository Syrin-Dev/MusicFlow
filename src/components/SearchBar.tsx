'use client';

import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function SearchBar() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce suggestions fetch
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSuggestions(data.slice(0, 5));
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    console.error('Failed to fetch suggestions', e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = (searchQuery: string) => {
        setQuery(searchQuery);
        setShowSuggestions(false);
        // Redirect to search results page
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            performSearch(query);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full z-40 max-w-2xl">
            <form onSubmit={handleSearch} className="relative group">
                {isLoading ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin z-10" size={20} />
                ) : (
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-white transition-colors z-10" size={20} />
                )}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setShowSuggestions(true)}
                    placeholder="What do you want to listen to?"
                    aria-label="Search music"
                    aria-busy={isLoading}
                    className="w-full bg-white/5 border border-white/5 text-white pl-12 pr-10 py-3 rounded-full focus:outline-none focus:bg-white/10 focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/20 shadow-lg shadow-black/20 backdrop-blur-xl transition-all placeholder:text-zinc-500 hover:bg-white/10 hover:border-white/10"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setSuggestions([]); }}
                        aria-label="Clear search"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel bg-[#0d0d0f]/95 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl z-50">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => performSearch(suggestion)}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors group"
                        >
                            <Search size={16} className="text-zinc-500 group-hover:text-[#8B5CF6] transition-colors" />
                            <span className="text-zinc-300 group-hover:text-white font-medium transition-colors">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
