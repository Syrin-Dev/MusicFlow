'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import { Heart, HeartOff } from 'lucide-react';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

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
// Base64 Silent Audio (WAV) - Short loop to keep AudioContext active
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    // Live Room State (Moved up for access)
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
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);
    const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const wakeLockRef = useRef<any>(null); // Use any to avoid type issues

    // Listening Event Tracking
    const trackingRef = useRef<{
        startTime: number;
        trackId: string;
        duration: number;
    } | null>(null);

    // Dynamic Refs to solve stale closure issues in YouTube API callbacks
    const onPlayerErrorRef = useRef((e: any) => { });
    const onPlayerStateChangeRef = useRef((e: any) => { });

    const togglePlayerExpansion = () => setIsPlayerExpanded(prev => !prev);
    const toggleVideoMode = () => setVideoMode(prev => !prev);
    const toggleVideoFullscreen = () => setIsVideoFullscreen(prev => !prev);

    // Wake Lock Helper
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                if (!wakeLockRef.current) {
                    const wakeLock = await (navigator as any).wakeLock.request('screen');
                    wakeLockRef.current = wakeLock;
                    wakeLock.addEventListener('release', () => {
                        wakeLockRef.current = null;
                    });
                }
            } catch (err) {
                console.error("Wake Lock error:", err);
            }
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            } catch (err) {
                console.error("Wake Lock release error:", err);
            }
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

                if (uniqueTracks.length > 0) {
                    setQueue(prev => [...prev, ...uniqueTracks]);
                }
            }
        } catch (e) {
            console.error("Auto-queue failed", e);
        }
    };

    // Auto-Queue (Infinity Scroll) - Relaxed dependency
    useEffect(() => {
        if (queue.length < 2 && !isLoading && currentTrack) {
            const timer = setTimeout(loadMoreRecommendations, 1000);
            return () => clearTimeout(timer);
        }
    }, [queue.length, currentTrack, isLoading]);

    // Initial Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedHistory = localStorage.getItem(LISTENING_HISTORY_KEY);
            if (storedHistory) {
                try {
                    setListeningHistory(JSON.parse(storedHistory));
                } catch (e) {
                    console.error('Failed to parse listening history:', e);
                }
            }
        }

        if (session?.user?.email) {
            fetch('/api/user/history')
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setListeningHistory(data); })
                .catch(err => console.error('Error fetching history:', err));

            fetch('/api/user/likes')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const mappedLikes = data.map((item: any) => ({
                            ...item,
                            id: item.videoId || item.id // Use videoId if available (it should be from DB), fallback to id
                        }));
                        setLikedSongs(mappedLikes);
                    }
                })
                .catch(err => console.error('Error fetching likes:', err));
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
        } catch (e) {
            console.error('Failed to record listening event:', e);
        }
    };

    const toggleLike = (track: Track) => {
        const isAlreadyLiked = likedSongs.some(t => t.id === track.id);
        const newLikedSongs = isAlreadyLiked
            ? likedSongs.filter(t => t.id !== track.id)
            : [track, ...likedSongs];
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


    // --- STANDARD CONTROLLER ---
    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const updateVolume = (vol: number) => {
        setVolume(vol);
        if (playerRef.current) {
            playerRef.current.setVolume(vol);
        }
    };

    const seekTo = (time: number) => {
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(time, true);
            setCurrentTime(time);
        }
    };

    const addToQueue = (track: Track) => {
        setQueue(prev => [...prev, track]);
    };

    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [connectInitialTrack, setConnectInitialTrack] = useState<Track | null>(null);

    const openConnect = (track?: Track) => {
        if (track) setConnectInitialTrack(track);
        setIsConnectOpen(true);
    };

    const closeConnect = () => {
        setIsConnectOpen(false);
        setConnectInitialTrack(null);
    };

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
                // toast.success("Living room started!");
            }
        } catch (e) { }
    };

    // Audio Control Logic
    const playTrackInternal = (track: Track, previousTrack?: Track | null) => {
        if (previousTrack && trackingRef.current && trackingRef.current.trackId === previousTrack.id) {
            const playDuration = (Date.now() - trackingRef.current.startTime) / 1000;
            const totalDuration = trackingRef.current.duration || duration;
            const skipped = playDuration < 30 && totalDuration > 30;
            recordListeningEvent(previousTrack, playDuration, totalDuration, skipped);
        }

        trackingRef.current = {
            startTime: Date.now(),
            trackId: track.id,
            duration: 0
        };

        setCurrentTrack(track);
        setIsLoading(true);
        setCurrentTime(0);
        saveToListeningHistory(track);
        requestWakeLock(); // Request Wake Lock on new track

        if (playerRef.current && playerRef.current.loadVideoById) {
            playerRef.current.loadVideoById(track.id);
        } else {
            setTimeout(() => {
                if (playerRef.current && playerRef.current.loadVideoById) {
                    playerRef.current.loadVideoById(track.id);
                }
            }, 800);
        }

        // Essential: Play silent audio immediately on user interaction
        silentAudioRef.current?.play().catch(e => console.error("Ghost audio play failed", e));

        // Automatically start/update hosting room when playing
        hostRoom(track, 0).catch(() => { });
    };

    const playTrack = (track: Track) => {
        const prevTrack = currentTrack;
        if (currentTrack) {
            setHistory(prev => [...prev, currentTrack]);
        }
        playTrackInternal(track, prevTrack);
    };

    const playPlaylist = (tracks: Track[], startIndex: number = 0) => {
        if (!tracks || tracks.length === 0) return;

        const trackToPlay = tracks[startIndex];
        const prevTrack = currentTrack;
        if (currentTrack) {
            setHistory(prev => [...prev, currentTrack]);
        }

        // Reset Queue
        setQueue(tracks.slice(startIndex + 1));

        playTrackInternal(trackToPlay, prevTrack);
    };

    const playNext = () => {
        if (queue.length === 0) return;

        const prevTrack = currentTrack;
        if (currentTrack) {
            setHistory(prev => [...prev, currentTrack]);
        }

        let nextIndex = 0;
        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        }

        const nextTrack = queue[nextIndex];
        setQueue(prev => prev.filter((_, i) => i !== nextIndex));
        playTrackInternal(nextTrack, prevTrack);
    };

    const playPrevious = () => {
        if (currentTime > 3) {
            seekTo(0);
            return;
        }

        if (history.length === 0) return;
        const prevTrack = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        if (currentTrack) {
            setQueue(prev => [currentTrack, ...prev]);
        }
        playTrackInternal(prevTrack, currentTrack);
    };

    const handleTrackEnd = useCallback(() => {
        if (currentTrack && trackingRef.current && trackingRef.current.trackId === currentTrack.id) {
            const playDuration = (Date.now() - trackingRef.current.startTime) / 1000;
            const totalDuration = duration || trackingRef.current.duration;
            recordListeningEvent(currentTrack, playDuration, totalDuration, false);
            trackingRef.current = null;
        }

        if (repeat === 'one' && currentTrack) {
            trackingRef.current = {
                startTime: Date.now(),
                trackId: currentTrack.id,
                duration: duration
            };
            playerRef.current?.seekTo(0);
            playerRef.current?.playVideo();
        } else if (queue.length > 0) {
            playNext();
        } else {
            setIsPlaying(false);
            releaseWakeLock(); // Release lock when playback ends
        }
    }, [repeat, queue, history, currentTrack, duration]);

    // Keep Refs Updated for YouTube Callbacks
    useEffect(() => {
        onPlayerErrorRef.current = (event: any) => {
            console.warn("YouTube Player Warning (Skipping):", event.data);
            setIsLoading(false);

            if (queue.length > 0) {
                console.log("Skipping unplayable track...");
                setTimeout(() => playNext(), 500);
            } else {
                // Try to recover if auto-queue fills up soon
                setTimeout(() => {
                    if (queue.length > 0) playNext();
                    else setIsPlaying(false);
                }, 1500);
            }
        };

        onPlayerStateChangeRef.current = (event: any) => {
            if (event.data === 1) { // Playing
                setIsPlaying(true);
                setIsLoading(false);
                requestWakeLock(); // Request Lock

                // Clear any existing interval
                if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);

                // Start fresh interval
                timeUpdateInterval.current = setInterval(() => {
                    if (playerRef.current && playerRef.current.getCurrentTime) {
                        const time = playerRef.current.getCurrentTime();
                        const dur = playerRef.current.getDuration() || 0;
                        setCurrentTime(time);
                        setDuration(dur);

                        // Sync tracking
                        if (trackingRef.current) {
                            trackingRef.current.duration = dur;
                        }
                    }
                }, 1000);
            }
            if (event.data === 2) { // Paused
                setIsPlaying(false);
                releaseWakeLock(); // Release Lock
            }
            if (event.data === 0) handleTrackEnd(); // Ended
            if (event.data === 3) setIsLoading(true); // Buffering
        };
    }); // Intentionally no dependency array: update on every render

    const initPlayer = useCallback(() => {
        if (playerRef.current) return;

        playerRef.current = new (window as any).YT.Player('youtube-audio-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 0,
                controls: 0,
                playsinline: 1,
                origin: window.location.origin
            },
            events: {
                onReady: (e: any) => e.target.setVolume(volume),
                // Delegate to refs to access fresh state
                onStateChange: (e: any) => onPlayerStateChangeRef.current(e),
                onError: (e: any) => onPlayerErrorRef.current(e),
            },
        });
    }, [volume]);

    // YouTube IFrame API Initialization
    useEffect(() => {
        if ((window as any).YT) {
            initPlayer();
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = initPlayer;
    }, [initPlayer]);

    const toggleShuffle = () => setShuffle(prev => !prev);
    const toggleRepeat = () => setRepeat(prev => {
        if (prev === 'off') return 'all';
        if (prev === 'all') return 'one';
        return 'off';
    });

    // YouTube Event Handlers (Defined here to access functions like handleTrackEnd)
    const onPlayerStateChange = useCallback((event: any) => {
        const { data } = event;
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)

        if (data === 1) { // Playing
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(playerRef.current?.getDuration() || 0);
            requestWakeLock(); // Request Lock

            // Start time tracking
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    if (trackingRef.current) {
                        trackingRef.current.duration = playerRef.current.getDuration();
                    }
                }
            }, 1000);
        } else if (data === 2) { // Paused
            setIsPlaying(false);
            releaseWakeLock(); // Release Lock
        } else if (data === 0) { // Ended
            setIsPlaying(false);
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            releaseWakeLock(); // Release Lock
            handleTrackEnd();
        } else if (data === 3) { // Buffering
            setIsLoading(true);
        }
    }, [handleTrackEnd]);

    const onPlayerError = useCallback((event: any) => {
        console.error("YouTube Player Error:", event.data);
        setIsLoading(false);
        if (event.data === 150 || event.data === 101) {
            toast.error("Song unavailable (restricted). Skipping...");
            playNext(); // Use playNext
        } else {
            toast.error("Playback error occurred.");
        }
    }, [playNext]);

    // Update refs with fresh closures
    useEffect(() => {
        onPlayerStateChangeRef.current = onPlayerStateChange;
        onPlayerErrorRef.current = onPlayerError;
    }, [onPlayerStateChange, onPlayerError]);

    const reorderQueue = (fromIndex: number, toIndex: number) => {
        setQueue(prev => {
            const newQueue = [...prev];
            const [removed] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, removed);
            return newQueue;
        });
    };

    useEffect(() => {
        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
            releaseWakeLock(); // Clean up Wake Lock
        };
    }, []);

    // --- Media Session & Background Audio Sync ---

    // Passive Keep-Alive: ensure silent audio plays when isPlaying is true
    useEffect(() => {
        if (isPlaying) {
            silentAudioRef.current?.play().catch(() => { });
            requestWakeLock();
        } else {
            silentAudioRef.current?.pause();
            releaseWakeLock();
        }
    }, [isPlaying]);

    // Initial Media Session Setup - Run ONCE
    const playNextRef = useRef(playNext);
    const playPreviousRef = useRef(playPrevious);
    const togglePlayRef = useRef(togglePlay);
    const seekToRef = useRef(seekTo);

    useEffect(() => {
        playNextRef.current = playNext;
        playPreviousRef.current = playPrevious;
        togglePlayRef.current = togglePlay;
        seekToRef.current = seekTo;
    }, [playNext, playPrevious, togglePlay, seekTo]);

    // Force Metadata Update
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentTrack) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: 'Hievly Music',
            artwork: [
                { src: currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' },
                { src: currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/maxresdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

    }, [currentTrack?.id, queue.length]);

    // Initial Media Session Setup - Run ONCE
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const setHandlers = () => {
            const actions: [MediaSessionAction, (details: any) => void][] = [
                ['play', () => { togglePlayRef.current(); }],
                ['pause', () => { togglePlayRef.current(); }],
                ['previoustrack', () => { playPreviousRef.current(); }],
                ['nexttrack', () => { playNextRef.current(); }],
                ['seekbackward', () => { seekToRef.current(Math.max(0, currentTime - 10)); }],
                ['seekforward', () => { seekToRef.current(Math.min(duration, currentTime + 10)); }],
                ['seekto', (details: any) => { if (details.seekTime !== undefined) seekToRef.current(details.seekTime); }]
            ];

            actions.forEach(([action, handler]) => {
                try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) { }
            });
        };

        setHandlers();

        return () => {
            // Optional: clear handlers? Usually better to leave them or overwrite.
        };
    }, []); // Empty dependency! Stable handlers.

    // Background Resilience Logic
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'hidden' && isPlaying) {
                // When leaving the app, make sure our ghost audio is definitely playing
                try {
                    await silentAudioRef.current?.play();
                } catch (e) {
                    console.error("Silent audio play on vis change failed", e);
                }

                // And try to keep YT playing
                if (playerRef.current && playerRef.current.getPlayerState && playerRef.current.getPlayerState() !== 1) {
                     playerRef.current.playVideo();
                }

                // Re-acquire Wake Lock if needed
                requestWakeLock();
            } else if (document.visibilityState === 'visible' && isPlaying) {
                 // Re-acquire if lost
                 requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying]);

    // Reliable Session Position Update
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }, [isPlaying]);

    // Background keep-alive monitor removed - relying on Master Audio events

    useEffect(() => {
        if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
        try {
            if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: 1,
                    position: Math.min(currentTime, duration),
                });
            }
        } catch (e) { }
    }, [currentTime, duration]);

    // Room Heartbeat Sync
    useEffect(() => {
        let interval: any;

        const sync = async () => {
            if (isHostingRoom && currentTrack) {
                await fetch('/api/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'CREATE_ROOM',
                        trackId: currentTrack.id,
                        progress: Math.floor(currentTime)
                    })
                });
            } else if (currentRoomId && !isHostingRoom) {
                const res = await fetch(`/api/rooms?roomId=${currentRoomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRoomData(data);

                    if (data.activeTrack && (!currentTrack || currentTrack.id !== data.activeTrack.id)) {
                        playTrackInternal(data.activeTrack);
                        setTimeout(() => seekTo(data.progress), 1000);
                    } else if (data.activeTrack && Math.abs(currentTime - data.progress) > 4) {
                        seekTo(data.progress);
                    }
                }
            }
        };

        if (currentRoomId || isHostingRoom) {
            sync();
            interval = setInterval(sync, 4000);
        }

        return () => clearInterval(interval);
    }, [currentRoomId, isHostingRoom, currentTrack?.id, isPlaying]);

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
            <div
                id="youtube-player-portal"
                suppressHydrationWarning
                onClick={togglePlay}
                className={`fixed bg-black overflow-hidden transition-all duration-500 ${videoMode && isPlayerExpanded ? 'opacity-100 pointer-events-auto z-[60] inset-0' : ''}`}
                style={{
                    ...(videoMode && isPlayerExpanded ? {
                        height: isVideoFullscreen ? '100%' : 'calc(100% - 112px)',
                        width: '100%',
                        opacity: 1
                    } : {
                        width: '1px',
                        height: '1px',
                        opacity: 0.001,
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        zIndex: -1,
                        pointerEvents: 'none',
                        visibility: 'visible'
                    })
                }}
            >
                <div suppressHydrationWarning className="w-full h-full pointer-events-none flex items-center justify-center">
                    <div suppressHydrationWarning className="w-full h-full scale-[1.35] transform-gpu">
                        <div suppressHydrationWarning id="youtube-audio-player" className="w-full h-full" />
                    </div>
                </div>
            </div>
            <audio
                ref={silentAudioRef}
                // reliable long silence
                src={SILENT_AUDIO_URI}
                loop
                playsInline
                controls={false}
                style={{ position: 'fixed', top: 0, left: 0, opacity: 0.001, pointerEvents: 'none', width: '1px', height: '1px', visibility: 'visible' }}
            />
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
}
