'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import { Heart, HeartOff } from 'lucide-react';
import { UnifiedTrack as Track, toUnifiedTrack } from '@/lib/types/music';

interface AudioContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    volume: number;
    setVolume: (vol: number) => void;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    seekTo: (time: number) => void;
    queue: Track[];
    addToQueue: (track: Track) => void;
    playNext: () => void;
    playPrevious: () => void;
    shuffle: boolean;
    toggleShuffle: () => void;
    repeat: 'off' | 'one' | 'all';
    toggleRepeat: () => void;
    listeningHistory: Track[];
    likedSongs: Track[];
    toggleLike: (track: Track) => void;
    isLiked: (trackId: string) => boolean;
    isPlayerExpanded: boolean;
    togglePlayerExpansion: () => void;
    videoMode: boolean;
    toggleVideoMode: () => void;
    isVideoFullscreen: boolean;
    toggleVideoFullscreen: () => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    loadMoreRecommendations: () => Promise<void>;
    playPlaylist: (tracks: Track[], startIndex?: number) => void;
    isConnectOpen: boolean;
    connectInitialTrack: Track | null;
    openConnect: (track?: Track) => void;
    closeConnect: () => void;
    currentRoomId: string | null;
    isHostingRoom: boolean;
    joinRoom: (friendId: string) => Promise<void>;
    leaveRoom: () => Promise<void>;
    hostRoom: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const LISTENING_HISTORY_KEY = 'hievly_listening_history';
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    // Live Room State
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isHostingRoom, setIsHostingRoom] = useState(false);
    const [roomData, setRoomData] = useState<any>(null);

    // Playback State
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // New: Active Playback Source ('youtube' or 'html5' for SC/Audius)
    const [activeSource, setActiveSource] = useState<'youtube' | 'html5'>('youtube');

    // Playlist State
    const [queue, setQueue] = useState<Track[]>([]);
    const [history, setHistory] = useState<Track[]>([]);

    // User Data State
    const [listeningHistory, setListeningHistory] = useState<Track[]>([]);
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);

    // UI State
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    const [videoMode, setVideoMode] = useState(false);
    const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

    // Modes
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');

    const playerRef = useRef<any>(null);
    const html5AudioRef = useRef<HTMLAudioElement | null>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);
    const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const wakeLockRef = useRef<any>(null);

    const trackingRef = useRef<{
        startTime: number;
        trackId: string;
        duration: number;
    } | null>(null);

    const onPlayerErrorRef = useRef((e: any) => { });
    const onPlayerStateChangeRef = useRef((e: any) => { });

    const togglePlayerExpansion = () => setIsPlayerExpanded(prev => !prev);
    const toggleVideoMode = () => setVideoMode(prev => !prev);
    const toggleVideoFullscreen = () => setIsVideoFullscreen(prev => !prev);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                if (!wakeLockRef.current && document.visibilityState === 'visible') {
                    const wakeLock = await (navigator as any).wakeLock.request('screen');
                    wakeLockRef.current = wakeLock;
                    wakeLock.addEventListener('release', () => { wakeLockRef.current = null; });
                }
            } catch (err) { console.warn("Wake Lock failed:", err); }
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            try { await wakeLockRef.current.release(); wakeLockRef.current = null; }
            catch (err) { console.error("Wake Lock release error:", err); }
        }
    };

    const loadMoreRecommendations = async () => {
        if (!currentTrack) return;
        try {
            const query = `music similar to ${currentTrack.artist} ${currentTrack.title}`;
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const newTracks: Track[] = await res.json();
            if (Array.isArray(newTracks)) {
                const existingIds = new Set([currentTrack.id, ...queue.map(t => t.id)]);
                const uniqueTracks = newTracks.filter(t => !existingIds.has(t.id)).slice(0, 5);
                if (uniqueTracks.length > 0) setQueue(prev => [...prev, ...uniqueTracks]);
            }
        } catch (e) { console.error("Auto-queue failed", e); }
    };

    useEffect(() => {
        if (queue.length < 2 && !isLoading && currentTrack) {
            const timer = setTimeout(loadMoreRecommendations, 1000);
            return () => clearTimeout(timer);
        }
    }, [queue.length, currentTrack, isLoading]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedHistory = localStorage.getItem(LISTENING_HISTORY_KEY);
            if (storedHistory) {
                try {
                    const raw = JSON.parse(storedHistory);
                    if (Array.isArray(raw)) setListeningHistory(raw.map(toUnifiedTrack));
                } catch (e) { }
            }
        }
        if (session?.user?.email) {
            fetch('/api/user/history').then(res => res.json()).then(data => {
                if (Array.isArray(data)) setListeningHistory(data.map(toUnifiedTrack));
            });
            fetch('/api/user/likes').then(res => res.json()).then(data => {
                if (Array.isArray(data)) {
                    setLikedSongs(data.map((item: any) => toUnifiedTrack({
                        ...item,
                        id: item.videoId || item.id,
                    })));
                }
            });
        }
    }, [session]);

    useEffect(() => {
        if (typeof window !== 'undefined' && listeningHistory.length > 0) {
            localStorage.setItem(LISTENING_HISTORY_KEY, JSON.stringify(listeningHistory));
        }
    }, [listeningHistory]);

    const saveToListeningHistory = (track: Track) => {
        setListeningHistory(prev => {
            const filtered = prev.filter(t => t.id !== track.id);
            return [track, ...filtered].slice(0, 50);
        });
        if (session?.user?.email) {
            fetch('/api/user/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(track)
            }).catch(e => console.error('DB History sync failed', e));
        }
    };

    const recordListeningEvent = async (track: Track, playDuration: number, totalDuration: number, skipped: boolean) => {
        if (playDuration < 5) return;
        try {
            await fetch('/api/listening-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: track.id,
                    title: track.title,
                    artist: track.artist,
                    playDuration,
                    totalDuration,
                    skipped,
                    liked: isLiked(track.id)
                })
            });
        } catch (e) { console.error('Failed to record listening event:', e); }
    };

    const toggleLike = (track: Track) => {
        const isAlreadyLiked = likedSongs.some(t => t.id === track.id);
        const newLikedSongs = isAlreadyLiked ? likedSongs.filter(t => t.id !== track.id) : [track, ...likedSongs];
        setLikedSongs(newLikedSongs);
        if (session?.user?.email) {
            fetch('/api/user/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(track)
            }).catch(e => console.error('DB Like sync failed', e));
        }
    };

    const isLiked = (trackId: string) => likedSongs.some(t => t.id === trackId);

    // --- CONTROLLERS ---

    const togglePlay = () => {
        if (activeSource === 'youtube' && playerRef.current) {
            isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
        } else if (activeSource === 'html5' && html5AudioRef.current) {
            isPlaying ? html5AudioRef.current.pause() : html5AudioRef.current.play();
        }
    };

    const updateVolume = (vol: number) => {
        setVolume(vol);
        if (playerRef.current) playerRef.current.setVolume(vol);
        if (html5AudioRef.current) html5AudioRef.current.volume = vol / 100;
    };

    const seekTo = (time: number) => {
        if (activeSource === 'youtube' && playerRef.current?.seekTo) {
            playerRef.current.seekTo(time, true);
        } else if (activeSource === 'html5' && html5AudioRef.current) {
            html5AudioRef.current.currentTime = time;
        }
        setCurrentTime(time);
    };

    const addToQueue = (track: Track) => setQueue(prev => [...prev, track]);

    const toggleShuffle = () => setShuffle(prev => !prev);
    const toggleRepeat = () => setRepeat(prev => prev === 'off' ? 'one' : prev === 'one' ? 'all' : 'off');
    const reorderQueue = (fromIndex: number, toIndex: number) => {
        setQueue(prev => {
            const newQueue = [...prev];
            const [removed] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, removed);
            return newQueue;
        });
    };

    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [connectInitialTrack, setConnectInitialTrack] = useState<Track | null>(null);
    const openConnect = (track?: Track) => { if (track) setConnectInitialTrack(track); setIsConnectOpen(true); };
    const closeConnect = () => { setIsConnectOpen(false); setConnectInitialTrack(null); };

    const joinRoom = async (friendId: string) => {
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'JOIN_ROOM', friendId })
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentRoomId(data.id);
                setIsHostingRoom(false);
                setRoomData(data);
                toast.success("Joined live room!");
            }
        } catch (e) {
            toast.error("Failed to join room");
        }
    };

    const leaveRoom = async () => {
        try {
            await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'LEAVE_ROOM' })
            });
            setCurrentRoomId(null);
            setIsHostingRoom(false);
            setRoomData(null);
        } catch (e) { }
    };

    const hostRoom = async (trackOverride?: Track, progressOverride?: number) => {
        const track = trackOverride || currentTrack;
        const progress = progressOverride !== undefined ? progressOverride : Math.floor(currentTime);

        if (!track) return;
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_ROOM',
                    trackId: track.id,
                    progress: progress
                })
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentRoomId(data.id);
                setIsHostingRoom(true);
            }
        } catch (e) { }
    };

    // Unified Playback Logic with Failover
    const playTrackInternal = (track: Track, previousTrack?: Track | null) => {
        if (previousTrack && trackingRef.current) {
            const playDuration = (Date.now() - trackingRef.current.startTime) / 1000;
            recordListeningEvent(previousTrack, playDuration, trackingRef.current.duration, false);
        }

        trackingRef.current = { startTime: Date.now(), trackId: track.id, duration: 0 };
        setCurrentTrack(track);
        setIsLoading(true);
        setCurrentTime(0);
        saveToListeningHistory(track);
        requestWakeLock();
        silentAudioRef.current?.play().catch(() => { });

        // Prioritize Sources: YouTube -> Audius -> SoundCloud (simplest to hardest)
        if (track.sources?.youtubeId) {
            setActiveSource('youtube');
            // Pause HTML5
            html5AudioRef.current?.pause();
            if (playerRef.current && playerRef.current.loadVideoById) {
                playerRef.current.loadVideoById(track.sources.youtubeId);
            }
        } else if (track.sources?.audiusId) {
            setActiveSource('html5');
            // Pause YT
            playerRef.current?.pauseVideo();
            if (html5AudioRef.current) {
                html5AudioRef.current.src = `https://discoveryprovider.audius.co/v1/tracks/${track.sources.audiusId}/stream?app_name=Hievly`;
                html5AudioRef.current.play();
            }
        } else if (track.sources?.soundcloudId) {
            // SC streaming needs CLIENT_ID. Fallback or use a proxy if not available?
            // For now, failover might just be skipping if we can't play SC
            setActiveSource('html5');
            // Placeholder: Assume we might have a proxy or we skip
            console.warn("SoundCloud playback requires client_id integration in frontend");
            playNext(); // Skip for now until SC Player is fully implemented
        } else {
            playNext();
        }
    };

    const playTrack = (track: Track) => {
        if (currentTrack) setHistory(prev => [...prev, currentTrack]);
        playTrackInternal(track, currentTrack);
    };

    const playPlaylist = (tracks: Track[], startIndex = 0) => {
        if (!tracks.length) return;
        if (currentTrack) setHistory(prev => [...prev, currentTrack]);
        setQueue(tracks.slice(startIndex + 1));
        playTrackInternal(tracks[startIndex], currentTrack);
    };

    const playNext = () => {
        if (!queue.length) return;
        const prev = currentTrack;
        if (currentTrack) setHistory(prevHist => [...prevHist, currentTrack]);

        let nextIndex = 0;
        if (shuffle) nextIndex = Math.floor(Math.random() * queue.length);
        const next = queue[nextIndex];
        setQueue(q => q.filter((_, i) => i !== nextIndex));
        playTrackInternal(next, prev);
    };

    const playPrevious = () => {
        if (currentTime > 3) { seekTo(0); return; }
        if (!history.length) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        if (currentTrack) setQueue(q => [currentTrack, ...q]);
        playTrackInternal(prev, currentTrack);
    };

    const handleTrackEnd = useCallback(() => {
        if (repeat === 'one') { seekTo(0); togglePlay(); }
        else if (queue.length > 0) playNext();
        else { setIsPlaying(false); releaseWakeLock(); }
    }, [repeat, queue, currentTrack]);

    // HTML5 Events
    useEffect(() => {
        const audio = html5AudioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => handleTrackEnd();
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
        };
        const onError = () => {
            console.error("HTML5 Playback Error");
            // Failover logic could go here
            playNext();
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('error', onError);
        };
    }, [handleTrackEnd]);

    // YouTube Event Handlers
    const onPlayerError = useCallback((event: any) => {
        console.error("YouTube Player Error:", event.data);
        setIsLoading(false);

        // FAILOVER LOGIC
        if (currentTrack) {
            // If YT failed, try Audius?
            if (currentTrack.sources?.audiusId && activeSource === 'youtube') {
                console.log("Failing over to Audius...");
                setActiveSource('html5');
                if (html5AudioRef.current) {
                    html5AudioRef.current.src = `https://discoveryprovider.audius.co/v1/tracks/${currentTrack.sources.audiusId}/stream?app_name=Hievly`;
                    html5AudioRef.current.play();
                }
                return;
            }
        }

        toast.error("Song unavailable. Skipping...");
        playNext();
    }, [playNext, currentTrack, activeSource]);

    const onPlayerStateChange = useCallback((event: any) => {
        if (activeSource !== 'youtube') return;
        const { data } = event;
        if (data === 1) {
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(playerRef.current?.getDuration() || 0);
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                    setCurrentTime(playerRef.current.getCurrentTime());
                }
            }, 1000);
        } else if (data === 2) setIsPlaying(false);
        else if (data === 0) handleTrackEnd();
        else if (data === 3) setIsLoading(true);
    }, [handleTrackEnd, activeSource]);

    // Update Refs
    useEffect(() => {
        onPlayerStateChangeRef.current = onPlayerStateChange;
        onPlayerErrorRef.current = onPlayerError;
    }, [onPlayerStateChange, onPlayerError]);

    // Initialize YT
    const initPlayer = useCallback(() => {
        if (playerRef.current) return;
        playerRef.current = new (window as any).YT.Player('youtube-audio-player', {
            height: '100%',
            width: '100%',
            playerVars: { autoplay: 0, controls: 0, playsinline: 1, origin: window.location.origin },
            events: {
                onReady: (e: any) => e.target.setVolume(volume),
                onStateChange: (e: any) => onPlayerStateChangeRef.current(e),
                onError: (e: any) => onPlayerErrorRef.current(e),
            },
        });
    }, [volume]);

    useEffect(() => {
        if ((window as any).YT) { initPlayer(); return; }
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        (window as any).onYouTubeIframeAPIReady = initPlayer;
    }, [initPlayer]);

    return (
        <AudioContext.Provider value={{
            currentTrack, isPlaying, playTrack, togglePlay, volume, setVolume: updateVolume,
            isLoading, currentTime, duration, seekTo, queue, addToQueue, playNext, playPrevious,
            shuffle, toggleShuffle, repeat, toggleRepeat, listeningHistory, likedSongs,
            toggleLike, isLiked, isPlayerExpanded, togglePlayerExpansion, videoMode,
            toggleVideoMode, isVideoFullscreen, toggleVideoFullscreen, reorderQueue,
            loadMoreRecommendations, playPlaylist,
            isConnectOpen, connectInitialTrack, openConnect, closeConnect,
            currentRoomId, isHostingRoom, joinRoom, leaveRoom, hostRoom
        }}>
            {children}
            {/* YouTube Player */}
            <div id="youtube-player-portal" suppressHydrationWarning onClick={togglePlay} className={`fixed bg-black overflow-hidden transition-all duration-500 ${videoMode && isPlayerExpanded && activeSource === 'youtube' ? 'opacity-100 pointer-events-auto z-[60] inset-0' : ''}`} style={{ ...(videoMode && isPlayerExpanded && activeSource === 'youtube' ? { height: isVideoFullscreen ? '100%' : 'calc(100% - 112px)', width: '100%', opacity: 1 } : { width: '1px', height: '1px', opacity: 0.001, position: 'fixed', bottom: 0, left: 0, zIndex: -1, pointerEvents: 'none', visibility: 'visible' }) }}>
                <div suppressHydrationWarning className="w-full h-full pointer-events-none flex items-center justify-center">
                    <div suppressHydrationWarning className="w-full h-full scale-[1.35] transform-gpu">
                        <div suppressHydrationWarning id="youtube-audio-player" className="w-full h-full" />
                    </div>
                </div>
            </div>

            {/* HTML5 Player for Audius/SC */}
            <audio ref={html5AudioRef} style={{ display: 'none' }} />

            <audio ref={silentAudioRef} src={SILENT_AUDIO_URI} loop playsInline autoPlay muted={false} controls={false} style={{ position: 'fixed', top: 0, left: 0, opacity: 0.001, pointerEvents: 'none', width: '1px', height: '1px', visibility: 'visible' }} />
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
}
