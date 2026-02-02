'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Play, Heart, Clock, TrendingUp, Moon, Sun, Dumbbell, Brain, PartyPopper } from 'lucide-react';
import { useAudio } from '@/components/AudioProvider';

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

export default function ForYouPage() {
    const { playTrack, addToQueue, isLiked, toggleLike, currentTrack, isPlaying } = useAudio();
    const [recommendations, setRecommendations] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [context, setContext] = useState('home');
    const [personalized, setPersonalized] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecommendations = async (ctx: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/recommendations?context=${ctx}&limit=24`);
            const data: RecommendationsResponse = await response.json();

            if (data.recommendations) {
                setRecommendations(data.recommendations);
                setPersonalized(data.personalized);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        }
        setLoading(false);
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
            const toPlayerTrack = (t: Track) => ({
                ...t,
                thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`
            });
            playTrack(toPlayerTrack(recommendations[0]));
            recommendations.slice(1).forEach(track => addToQueue(toPlayerTrack(track)));
        }
    };

    const currentContextOption = CONTEXT_OPTIONS.find(c => c.id === context) || CONTEXT_OPTIONS[0];

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-32">
            {/* Hero Header */}
            <div className={`relative bg-gradient-to-br ${currentContextOption.color} p-8 pb-16`}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                                <Sparkles size={16} />
                                <span>{personalized ? 'Personalized for you' : 'Discover new music'}</span>
                            </div>
                            <h1 className="text-4xl font-bold text-white">
                                {currentContextOption.label}
                            </h1>
                            <p className="text-white/70 mt-2">
                                {personalized
                                    ? 'Based on your listening history and preferences'
                                    : 'Sign in to get personalized recommendations'
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={24} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handlePlayAll}
                                disabled={recommendations.length === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                <Play size={20} fill="currentColor" />
                                Play All
                            </button>
                        </div>
                    </div>

                    {/* Context Switcher */}
                    <div className="flex gap-3 flex-wrap">
                        {CONTEXT_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const isActive = context === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setContext(option.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${isActive
                                        ? 'bg-white text-black'
                                        : 'bg-white/10 text-white hover:bg-white/20'
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

            {/* Recommendations Grid */}
            <div className="p-8 -mt-8">
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
                                    ...track,
                                    thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                                };

                                return (
                                    <div
                                        key={`${track.id}-${index}`}
                                        className="group cursor-pointer"
                                    >
                                        <div
                                            className={`aspect-square rounded-2xl overflow-hidden relative mb-3 bg-[#1A1A1E] shadow-lg ring-2 transition-all ${isCurrentTrack ? 'ring-violet-500' : 'ring-transparent'
                                                }`}
                                            onClick={() => playTrack(playerTrack)}
                                        >
                                            <img
                                                src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                                alt={track.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                    <Play size={28} fill="currentColor" className="ml-1" />
                                                </button>
                                            </div>

                                            {/* Like button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLike(playerTrack);
                                                }}
                                                className={`absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${liked ? 'bg-violet-600 opacity-100' : 'bg-black/50 hover:bg-black/70'
                                                    }`}
                                            >
                                                <Heart size={16} className="text-white" fill={liked ? 'currentColor' : 'none'} />
                                            </button>

                                            {/* Now Playing indicator */}
                                            {isCurrentTrack && isPlaying && (
                                                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-violet-600 rounded-full">
                                                    <div className="flex gap-0.5">
                                                        <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                                                        <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                                                        <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                                            {track.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 truncate mt-1">
                                            {track.artist}
                                        </p>
                                        {track.reason && (
                                            <p className="text-xs text-violet-400/70 truncate mt-1">
                                                {track.reason}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Stats Section */}
                        {personalized && (
                            <div className="mt-12 p-6 bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-2xl border border-violet-500/20">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-violet-400" />
                                    Why these recommendations?
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Our recommendation engine analyzes your listening patterns including play duration,
                                    skip rate, and explicit feedback (likes). It uses a multi-objective ranking system
                                    that balances engagement signals with satisfaction predictions, inspired by
                                    state-of-the-art music recommendation research.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20">
                        <Sparkles size={64} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No recommendations yet</h3>
                        <p className="text-slate-400 mb-6">
                            Start listening to music to get personalized recommendations
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
