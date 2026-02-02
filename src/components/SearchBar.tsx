'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function SearchBar() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce suggestions fetch
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                try {
                    const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSuggestions(data.slice(0, 5));
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    console.error('Failed to fetch suggestions', e);
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
        <div ref={wrapperRef} className="relative w-96 z-40">
            <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-white transition-colors" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setShowSuggestions(true)}
                    placeholder="Search for songs, artists, albums..."
                    className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-10 py-3.5 rounded-full focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl transition-all placeholder:text-slate-400/70 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(139,92,246,0.1)]"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setSuggestions([]); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-2xl shadow-xl overflow-hidden py-2 backdrop-blur-xl bg-opacity-90">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => performSearch(suggestion)}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors group"
                        >
                            <Search size={16} className="text-gray-500 group-hover:text-white" />
                            <span className="text-gray-300 group-hover:text-white">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
