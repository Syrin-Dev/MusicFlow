'use client';

import { useRouter } from 'next/navigation';
import { useAudio } from './AudioProvider';
import { useEffect, useState, useRef } from 'react';
import {
    ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart,
    ListMusic, Volume2, Mic2, Maximize2, Minimize2, Languages, Globe,
    ArrowUp, ArrowDown
} from 'lucide-react';

// Format seconds to mm:ss helper
function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ExpandedPlayer() {
    const router = useRouter();
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        currentTime,
        duration,
        seekTo,
        isPlayerExpanded,
        togglePlayerExpansion,
        queue,
        toggleLike,
        isLiked,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
        playTrack,
        videoMode,
        toggleVideoMode,
        isVideoFullscreen,
        toggleVideoFullscreen,
        reorderQueue,
        loadMoreRecommendations
    } = useAudio();

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            reorderQueue(draggedIndex, index);
        }
        setDraggedIndex(null);
    };

    const [activeTab, setActiveTab] = useState<'upNext' | 'lyrics' | 'related'>('upNext');
    const [relatedTracks, setRelatedTracks] = useState<any[]>([]);

    // Lyrics State
    const [originalLyrics, setOriginalLyrics] = useState<{ time: number, text: string }[] | null>(null);
    const [translatedLyrics, setTranslatedLyrics] = useState<string[] | null>(null);
    const [showTranslated, setShowTranslated] = useState(false);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    // Synced Lyrics Logic
    const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
    const activeLineRef = useRef<HTMLParagraphElement>(null);

    // Translation Language State
    const [targetLang, setTargetLang] = useState('bg');
    const [showLangMenu, setShowLangMenu] = useState(false);

    const LANGUAGES = [
        { code: 'bg', label: 'Bulgarian' },
        { code: 'en', label: 'English' },
        { code: 'de', label: 'German' },
        { code: 'es', label: 'Spanish' },
        { code: 'fr', label: 'French' },
        { code: 'ru', label: 'Russian' },
        { code: 'ja', label: 'Japanese' },
        { code: 'tr', label: 'Turkish' },
    ];

    useEffect(() => {
        if (isPlayerExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isPlayerExpanded]);

    // Track Active Line based on currentTime (Synced Scrolling)
    useEffect(() => {
        if (!originalLyrics || activeTab !== 'lyrics') return;

        // Find the active line: the last line where time <= currentTime
        const index = originalLyrics.findLastIndex(line => line.time <= currentTime);

        if (index !== -1 && index !== activeLineIndex) {
            setActiveLineIndex(index);
            // Auto scroll to active line
            if (activeLineRef.current) {
                activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime, originalLyrics, activeTab]);

    // Data Fetching based on Tab
    useEffect(() => {
        if (!currentTrack) return;

        if (activeTab === 'related') {
            const query = `mix ${currentTrack.artist} ${currentTrack.title}`;
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setRelatedTracks(data.filter((t: any) => t.id !== currentTrack.id).slice(0, 10));
                    }
                })
                .catch(err => console.error(err));
        } else if (activeTab === 'lyrics') {
            setIsLoadingLyrics(true);
            setOriginalLyrics(null);
            setTranslatedLyrics(null);
            setShowTranslated(false);
            setTranslatedLyrics(null);
            setActiveLineIndex(-1);

            fetch(`/api/lyrics?artist=${encodeURIComponent(currentTrack.artist)}&title=${encodeURIComponent(currentTrack.title)}&videoId=${currentTrack.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.lines) {
                        setOriginalLyrics(data.lines);
                    } else {
                        setOriginalLyrics(null);
                    }
                })
                .catch(() => setOriginalLyrics(null))
                .finally(() => setIsLoadingLyrics(false));
        }
    }, [activeTab, currentTrack]);

    const handleTranslate = async () => {
        if (!originalLyrics) return;

        if (showTranslated) {
            setShowTranslated(false);
            return;
        }

        if (translatedLyrics && showTranslated === false) {
        }

        setIsTranslating(true);
        try {
            const textToTranslate = originalLyrics.map(l => l.text).join('\n');
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToTranslate, targetLang: targetLang })
            });
            const data = await res.json();
            if (data.translatedText) {
                setTranslatedLyrics(data.translatedText.split('\n'));
                setShowTranslated(true);
            }
        } catch (e) {
            console.error("Translation failed", e);
        } finally {
            setIsTranslating(false);
        }
    };

    useEffect(() => {
        if (showTranslated && originalLyrics) {
            handleTranslate();
        }
    }, [targetLang]);

    if (!currentTrack) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const liked = isLiked(currentTrack.id);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        seekTo(percentage * duration);
    };

    const navigateToArtist = () => {
        togglePlayerExpansion();
        router.push(`/search?q=${encodeURIComponent(currentTrack.artist)}`);
    };

    const getLineText = (index: number) => {
        if (showTranslated && translatedLyrics && translatedLyrics[index]) {
            return translatedLyrics[index];
        }
        return originalLyrics ? originalLyrics[index].text : '';
    };

    const styles = {
        glass: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        albumBlur: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundImage: `url(https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) brightness(0.3)',
            transform: 'scale(1.1)',
            transition: 'opacity 0.5s ease-in-out',
            opacity: videoMode ? 0 : 1
        }
    };

    if (isVideoFullscreen && videoMode) {
        return (
            <div className="fixed inset-0 z-[80] pointer-events-none">
                <div className="pointer-events-auto absolute top-6 right-6 z-[90] flex gap-4">
                    <button
                        onClick={toggleVideoFullscreen}
                        className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all shadow-xl border border-white/10 group"
                    >
                        <Minimize2 size={24} />
                    </button>
                    <button
                        onClick={togglePlayerExpansion}
                        className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all shadow-xl border border-white/10"
                    >
                        <ChevronDown size={24} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-sans will-change-transform ${isPlayerExpanded ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
            style={{ backgroundColor: videoMode ? 'transparent' : '#0A0A0B' }}
        >
            <div style={styles.albumBlur}></div>
            {videoMode && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>}

            {/* Header */}
            <div className={`relative z-[70] h-16 md:h-20 flex-shrink-0 flex items-center justify-between px-6 md:px-8 transition-colors duration-500 ${videoMode ? 'bg-transparent' : 'bg-gradient-to-b from-black/60 to-transparent'}`}>
                <button
                    onClick={togglePlayerExpansion}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                >
                    <ChevronDown size={32} />
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ ...styles.glass, padding: '4px', borderRadius: '9999px' }}>
                        <button onClick={() => { if (videoMode) toggleVideoMode(); }} className={`px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${!videoMode ? 'bg-white/10' : 'hover:bg-white/5 text-slate-400'}`}>Song</button>
                        <button onClick={() => { if (!videoMode) toggleVideoMode(); }} className={`px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${videoMode ? 'bg-white/10' : 'hover:bg-white/5 text-slate-400'}`}>Video</button>
                    </div>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Main Content: Flex Col on Mobile, Row on Desktop */}
            <main className="relative z-[70] flex-1 flex flex-col md:flex-row items-center justify-start md:justify-center px-6 md:px-12 gap-8 md:gap-16 overflow-y-auto md:overflow-hidden min-h-0 py-4 md:py-8 no-scrollbar">

                {/* Album Art Container Mobile Optimized */}
                <div className={`flex-shrink-0 flex flex-col items-center justify-center w-full md:w-auto md:flex-1 transition-opacity duration-500 ${videoMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative group w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] md:max-w-[45vh] md:max-h-[45vh] md:w-full md:h-auto aspect-square">
                        <img
                            alt={currentTrack.title}
                            className="w-full h-full object-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                            src={`https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                        />
                    </div>
                    {/* Title and Artist for Mobile are better placed here or in footer depending on design. Let's keep desktop logic but ensure it fits */}
                    <div className="mt-8 text-center md:block hidden">
                        <h2 className="text-3xl font-bold truncate max-w-lg text-white">{currentTrack.title}</h2>
                        <button
                            onClick={navigateToArtist}
                            className="text-xl text-slate-400 mt-2 truncate max-w-lg hover:text-white hover:underline transition-all"
                        >
                            {currentTrack.artist}
                        </button>
                    </div>
                </div>

                {/* Mobile Title view (shown only on mobile) */}
                <div className="block md:hidden text-center w-full -mt-4">
                    <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex-1 text-left min-w-0 pr-4">
                            <h2 className="text-2xl font-bold truncate text-white">{currentTrack.title}</h2>
                            <p className="text-lg text-slate-400 truncate">{currentTrack.artist}</p>
                        </div>
                        <button onClick={() => toggleLike(currentTrack)} className={`p-2 transition-colors ${liked ? 'text-[#8B5CF6]' : 'text-slate-400'}`}>
                            <Heart size={28} fill={liked ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>

                {/* Mobile Scrubber & Controls (Replicating Footer logic for mobile but inline) */}
                <div className="block md:hidden w-full space-y-6 mb-8">
                    {/* Scrubber */}
                    <div className="group relative w-full h-4 flex items-center" onClick={handleSeek}>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-[#8B5CF6]" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="absolute h-4 w-4 bg-white rounded-full shadow-lg left-0 ml-[-8px]" style={{ left: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-medium -mt-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between px-2">
                        <button onClick={toggleShuffle} className={`${shuffle ? 'text-[#8B5CF6]' : 'text-slate-400'}`}> <Shuffle size={24} /> </button>
                        <button onClick={playPrevious} className="text-white"> <SkipBack size={32} fill="currentColor" /> </button>
                        <button onClick={togglePlay} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={playNext} className="text-white"> <SkipForward size={32} fill="currentColor" /> </button>
                        <button onClick={toggleRepeat} className={`relative ${repeat !== 'off' ? 'text-[#8B5CF6]' : 'text-slate-400'}`}>
                            <Repeat size={24} />
                            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-[#8B5CF6] text-white rounded-full px-1">1</span>}
                        </button>
                    </div>

                    {/* Mobile Tabs Wrapper (simple list for now) */}
                    <div className="mt-8">
                        <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-gray-500">Up Next</h3>
                        {queue.slice(0, 3).map((track, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5" onClick={() => playTrack(track)}>
                                <img src={`https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`} className="w-10 h-10 rounded-md object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel (Tabs) - Desktop Only */}
                <aside
                    className={`hidden md:flex w-full max-w-md h-full max-h-[65vh] rounded-[32px] p-8 flex-col transition-all duration-500 ease-in-out ${videoMode ? 'opacity-0 translate-x-20 pointer-events-none' : 'opacity-100 translate-x-0'}`}
                    style={styles.glass}
                >
                    {/* Tab Switcher */}
                    <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4 flex-shrink-0">
                        <div className="flex gap-6">
                            {(['upNext', 'lyrics', 'related'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-bold pb-4 -mb-[18px] transition-colors uppercase ${activeTab === tab
                                        ? 'border-b-2 border-[#8B5CF6] text-white'
                                        : 'text-slate-400 hover:text-white border-b-2 border-transparent'
                                        }`}
                                >
                                    {tab === 'upNext' ? 'Up Next' : tab}
                                </button>
                            ))}
                        </div>
                        {activeTab === 'lyrics' && originalLyrics && (
                            <div className="relative flex items-center gap-2">
                                <button onClick={() => setShowLangMenu(!showLangMenu)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <Languages size={20} />
                                </button>
                                <button onClick={handleTranslate} disabled={isTranslating} className={`p-2 rounded-full transition-colors ${showTranslated ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 text-slate-400 hover:text-white'}`}>
                                    {isTranslating ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Globe size={20} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* UP NEXT DESKTOP */}
                    {activeTab === 'upNext' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            <div className="flex items-center gap-4 p-3 bg-white/10 rounded-2xl border border-[#8B5CF6]/20 flex-shrink-0">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <img alt="Current" className="w-full h-full object-cover" src={`https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`} />
                                    <div className="absolute inset-0 bg-[#8B5CF6]/40 flex items-center justify-center">
                                        <Volume2 size={20} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold truncate text-[#8B5CF6]">Now Playing</h4>
                                    <p className="text-xs text-white truncate">{currentTrack.title}</p>
                                </div>
                            </div>
                            {queue.map((track, i) => (
                                <div key={`${track.id}-${i}`} draggable onDragStart={(e) => handleDragStart(e, i)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, i)} onClick={() => playTrack(track)}
                                    className={`flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group ${draggedIndex === i ? 'opacity-50 ring-2 ring-[#8B5CF6] ring-inset' : ''}`}>
                                    <img alt={track.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" src={`https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold truncate group-hover:text-[#8B5CF6] transition-colors">{track.title}</h4>
                                        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); if (i > 0) reorderQueue(i, i - 1); }} className="p-1 hover:bg-white/20 rounded-full" disabled={i === 0}> <ArrowUp size={14} className={i === 0 ? "text-slate-600" : "text-slate-300"} /> </button>
                                        <button onClick={(e) => { e.stopPropagation(); if (i < queue.length - 1) reorderQueue(i, i + 1); }} className="p-1 hover:bg-white/20 rounded-full" disabled={i === queue.length - 1}> <ArrowDown size={14} className={i === queue.length - 1 ? "text-slate-600" : "text-slate-300"} /> </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={loadMoreRecommendations} className="w-full py-4 text-center text-sm font-semibold text-[#8B5CF6] hover:text-white hover:bg-white/5 rounded-xl transition-colors">Load more</button>
                        </div>
                    )}

                    {/* LYRICS DESKTOP */}
                    {activeTab === 'lyrics' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-4 mask-gradient">
                            {isLoadingLyrics ? (
                                <div className="flex items-center justify-center h-full"> <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div> </div>
                            ) : originalLyrics && originalLyrics.length > 0 ? (
                                <div className="text-left w-full space-y-4 pb-20">
                                    {originalLyrics.map((line, idx) => {
                                        const isActive = idx === activeLineIndex;
                                        const text = getLineText(idx);
                                        if (!text) return null;
                                        return (<p key={idx} ref={isActive ? activeLineRef : null} onClick={() => line.time > 0 && seekTo(line.time)} className={`cursor-pointer transition-all duration-300 ease-out leading-relaxed max-w-[90%] ${isActive ? 'text-white text-2xl font-bold opacity-100 scale-105 origin-left' : 'text-slate-400 text-lg font-medium opacity-50 hover:opacity-80'}`}>{text}</p>)
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center"> <Mic2 size={48} className="text-slate-600 mb-4" /> <h3 className="text-xl font-bold text-slate-300 mb-2">Lyrics Unavailable</h3> </div>
                            )}
                        </div>
                    )}
                </aside>
            </main>

            {/* Desktop Footer (Hidden on Mobile, as Mobile has inline controls) */}
            <footer className={`hidden md:flex relative z-[70] h-28 flex-shrink-0 border-t border-white/10 px-12 flex-col justify-center transition-colors duration-500 ${videoMode ? 'bg-[#0A0A0B]' : 'bg-[#0A0A0B]/80 backdrop-blur-md'}`}>
                {/* Scrubber */}
                <div className="absolute top-0 left-0 right-0 h-1.5 w-full bg-white/10 cursor-pointer group" onClick={handleSeek}>
                    <div className="absolute top-0 left-0 h-full bg-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.6)]" style={{ width: `${progress}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 w-1/4">
                        <div className="min-w-0">
                            <h3 className="font-bold truncate text-white">{currentTrack.title}</h3>
                            <button onClick={(e) => { e.stopPropagation(); navigateToArtist(); }} className="text-xs text-slate-400 truncate hover:text-white hover:underline transition-all block text-left">
                                {currentTrack.artist}
                            </button>
                        </div>
                        <button onClick={() => toggleLike(currentTrack)} className={`p-2 hover:bg-white/10 rounded-full transition-colors ${liked ? 'text-[#8B5CF6]' : 'text-slate-400'}`}>
                            <Heart size={20} fill={liked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-6">
                            <button onClick={toggleShuffle} className={`p-2 transition-colors ${shuffle ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-white'}`}> <Shuffle size={20} /> </button>
                            <button onClick={playPrevious} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"> <SkipBack size={28} fill="currentColor" /> </button>
                            <button onClick={togglePlay} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            <button onClick={playNext} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"> <SkipForward size={28} fill="currentColor" /> </button>
                            <button onClick={toggleRepeat} className={`p-2 transition-colors relative ${repeat !== 'off' ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-white'}`}>
                                <Repeat size={20} />
                                {repeat === 'one' && <span className="absolute top-0 right-0 text-[10px font-bold]">1</span>}
                            </button>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-slate-400 tabular-nums">
                            <span>{formatTime(currentTime)}</span><span>/</span><span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-6 w-1/4">
                        <button className="text-slate-400 hover:text-white p-2">
                            <ListMusic size={20} />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
