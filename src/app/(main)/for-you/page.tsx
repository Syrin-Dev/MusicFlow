'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Play, Heart, TrendingUp, Moon, Dumbbell, Brain, PartyPopper, Flame, History, Music2 } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';
import { toUnifiedTrack } from '@/lib/types/music';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    score?: number;
    reason?: string;
}

interface RecommendationsResponse {
    recommendations: Track[];
    personalized: boolean;
    context: string;
}

const CONTEXT_OPTIONS = [
    { id: 'home', label: 'For You', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
    { id: 'workout', label: 'Workout', icon: Dumbbell, color: 'from-orange-500 to-red-600' },
    { id: 'chill', label: 'Chill', icon: Moon, color: 'from-blue-500 to-cyan-600' },
    { id: 'focus', label: 'Focus', icon: Brain, color: 'from-green-500 to-emerald-600' },
    { id: 'party', label: 'Party', icon: PartyPopper, color: 'from-pink-500 to-rose-600' },
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

export default function ForYouPage() {
    const { playTrack, addToQueue, isLiked, toggleLike, currentTrack, isPlaying, listeningHistory } = useAudio();
    const [recommendations, setRecommendations] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [context, setContext] = useState('home');
    const [personalized, setPersonalized] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    const fetchRecommendations = async (ctx: string) => {
        setLoading(true);
        try {
            // First try to get personalized recommendations
            const response = await fetch(`/api/recommendations?context=${ctx}&limit=24`);
            const data: RecommendationsResponse = await response.json();

            if (data.recommendations && data.recommendations.length > 0) {
                setRecommendations(data.recommendations);
                setPersonalized(data.personalized);
            } else {
                // FALLBACK: If no personal recommendations, fetch trending/popular
                // This ensures we NEVER show an empty screen
                await fetchTrendingFallback(ctx);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
            await fetchTrendingFallback(ctx);
        }
        setLoading(false);
    };

    const fetchTrendingFallback = async (ctx: string) => {
        try {
            // Map context to search queries
            let query = 'Global Top 50';
            if (ctx === 'workout') query = 'Workout Motivation';
            if (ctx === 'chill') query = 'Chill Vibes';
            if (ctx === 'focus') query = 'Focus & Study';
            if (ctx === 'party') query = 'Party Hits 2024';

            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const fallbackData = await res.json();

            if (Array.isArray(fallbackData)) {
                setRecommendations(fallbackData.slice(0, 24).map(track => ({
                    ...track,
                    reason: 'Trending based on selection'
                })));
                setPersonalized(false);
            }
        } catch (e) {
            console.error("Fallback fetch failed", e);
        }
    };

    useEffect(() => {
        fetchRecommendations(context);
    }, [context]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchRecommendations(context);
        setRefreshing(false);
    };

    const handlePlayAll = () => {
        if (recommendations.length > 0) {
            playTrack(toUnifiedTrack(recommendations[0]));
            recommendations.slice(1).forEach(track => addToQueue(toUnifiedTrack(track)));
        }
    };

    const currentContextOption = CONTEXT_OPTIONS.find(c => c.id === context) || CONTEXT_OPTIONS[0];

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">
            {/* Dynamic Hero Header with Glassmorphism */}
            <div className={`relative bg-gradient-to-br ${currentContextOption.color} transition-colors duration-1000`}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#0A0A0B]"></div>

                <div className="relative z-10 p-8 pb-12 pt-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                {personalized ? <Sparkles size={14} className="text-yellow-300" /> : <Flame size={14} className="text-orange-400" />}
                                <span>{personalized ? 'Made for You' : 'Trending Now'}</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-xl">
                                {greeting}
                            </h1>
                            <p className="text-xl text-white/90 font-medium">
                                {personalized
                                    ? `Here's your ${currentContextOption.label.toLowerCase()} mix.`
                                    : `Top picks for ${currentContextOption.label.toLowerCase()}.`
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full transition-all border border-white/10 backdrop-blur-md group"
                                aria-label="Refresh"
                            >
                                <RefreshCw size={24} className={`text-white group-hover:rotate-180 transition-transform duration-700 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handlePlayAll}
                                disabled={recommendations.length === 0}
                                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 hover:shadow-white/20"
                            >
                                <Play size={24} fill="currentColor" />
                                Play All
                            </button>
                        </div>
                    </div>

                    {/* Context Switcher - Floating Glass */}
                    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                        {CONTEXT_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const isActive = context === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setContext(option.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap border ${isActive
                                        ? 'bg-white text-black border-white shadow-lg scale-105'
                                        : 'bg-black/20 text-white/90 border-white/10 hover:bg-black/40 hover:border-white/30 backdrop-blur-sm'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-12 -mt-6 relative z-20">
                {/* Recently Played Section (Only if history exists) */}
                {listeningHistory.length > 0 && (
                    <section>
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
                            <History size={24} className="text-violet-400" />
                            Jump Back In
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {listeningHistory.slice(0, 6).map((track, i) => (
                                <div
                                    key={i}
                                    onClick={() => playTrack(toUnifiedTrack(track))}
                                    className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2 rounded-lg cursor-pointer transition-colors border border-white/5 hover:border-white/10"
                                >
                                    <img
                                        src={track.thumbnail}
                                        alt={track.title}
                                        referrerPolicy="no-referrer"
                                        className="w-12 h-12 rounded md:rounded object-cover shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white text-sm truncate">{track.title}</h4>
                                        <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 mr-2 transition-opacity">
                                        <Play size={16} fill="white" className="text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recommendations Grid */}
                <section>
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
                        {personalized ? <Brain size={24} className="text-violet-400" /> : <TrendingUp size={24} className="text-pink-400" />}
                        {personalized ? 'Recommended for You' : 'Trending Now'}
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-square bg-white/5 rounded-2xl mb-3" />
                                    <div className="h-4 bg-white/5 rounded mb-2 w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : recommendations.length > 0 ? (
                        <>
                            {/* Main Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                {recommendations.map((track, index) => {
                                    const isCurrentTrack = currentTrack?.id === track.id;
                                    const liked = isLiked(track.id);
                                    const playerTrack = {
                                        id: track.id,
                                        title: track.title,
                                        artist: track.artist,
                                        thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                                    };

                                    return (
                                        <div
                                            key={`${track.id}-${index}`}
                                            className="group cursor-pointer p-3 rounded-2xl hover:bg-white/5 transition-all duration-300"
                                            onClick={() => playTrack(toUnifiedTrack(playerTrack))}
                                        >
                                            <div
                                                className={`aspect-square rounded-2xl overflow-hidden relative mb-4 bg-[#1A1A1E] shadow-xl ring-2 transition-all group-hover:shadow-2xl ${isCurrentTrack ? 'ring-violet-500' : 'ring-transparent'
                                                    }`}
                                            >
                                                <img
                                                    src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                                    alt={track.title}
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    loading="lazy"
                                                />

                                                {/* Play overlay */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-violet-500">
                                                        <Play size={24} fill="currentColor" className="ml-1" />
                                                    </button>
                                                </div>

                                                {/* Like button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleLike(toUnifiedTrack(playerTrack));
                                                    }}
                                                    className={`absolute top-2 right-2 p-2 rounded-full transform transition-all duration-300 ${liked
                                                        ? 'bg-violet-600 opacity-100 scale-100'
                                                        : 'opacity-0 scale-90 bg-black/60 group-hover:opacity-100 group-hover:scale-100'}`}
                                                >
                                                    <Heart size={16} className={liked ? 'text-white' : 'text-zinc-300'} fill={liked ? 'currentColor' : 'none'} />
                                                </button>

                                                {/* Now Playing indicator */}
                                                {isCurrentTrack && isPlaying && (
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                                                        <span className="w-1 h-3 bg-violet-500 rounded-full animate-music-bar-1" />
                                                        <span className="w-1 h-5 bg-violet-500 rounded-full animate-music-bar-2" />
                                                        <span className="w-1 h-2 bg-violet-500 rounded-full animate-music-bar-3" />
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                                                {track.title}
                                            </h3>
                                            <p className="text-sm text-zinc-400 truncate mt-1 group-hover:text-zinc-300">
                                                {track.artist}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Stats Section with Glassmorphism */}
                            {personalized && (
                                <div className="mt-16 relative overflow-hidden rounded-3xl border border-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 backdrop-blur-md"></div>
                                    <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="bg-white/10 p-4 rounded-full">
                                            <TrendingUp size={32} className="text-violet-200" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-white mb-2">Curated just for you</h3>
                                            <p className="text-zinc-300 leading-relaxed max-w-2xl">
                                                Our recommendation engine analyzes your listening patterns, skip rates, and favorites to
                                                deliver a mix that evolves with your taste. The more you listen, the better it gets.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // This state should theoretically be unreachable with the new fallback logic
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                            <Music2 size={64} className="mx-auto text-zinc-600 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Start your journey</h3>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                                Search for your favorite artists to kickstart the recommendation engine.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
