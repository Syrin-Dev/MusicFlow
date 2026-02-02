'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";

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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const LISTENING_HISTORY_KEY = 'streamflow_listening_history';

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    // Playback State
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Playlist State
    const [queue, setQueue] = useState<Track[]>([]);
    const [history, setHistory] = useState<Track[]>([]); // Current session playback history (for "Previous" button)

    // User Data State
    const [listeningHistory, setListeningHistory] = useState<Track[]>([]); // Permanent history
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);

    // UI State
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    const [videoMode, setVideoMode] = useState(false); // Default to Song mode
    const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

    const togglePlayerExpansion = () => setIsPlayerExpanded(prev => !prev);
    const toggleVideoMode = () => setVideoMode(prev => !prev);
    const toggleVideoFullscreen = () => setIsVideoFullscreen(prev => !prev);

    const loadMoreRecommendations = async () => {
        if (!currentTrack) return;

        try {
            // Find more songs by the same artist
            const query = `music similar to ${currentTrack.artist} ${currentTrack.title}`;
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const newTracks: Track[] = await res.json();

            if (Array.isArray(newTracks)) {
                // Determine existing IDs to avoid duplicates
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

    // Auto-Queue (Infinity Scroll)
    useEffect(() => {
        if (queue.length < 2 && isPlaying && !isLoading && currentTrack) {
            const timer = setTimeout(loadMoreRecommendations, 1000);
            return () => clearTimeout(timer);
        }
    }, [queue.length, currentTrack, isPlaying, isLoading]);

    // Modes
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');

    const playerRef = useRef<any>(null);
    const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

    // Listening Event Tracking for Recommendation Engine
    const trackingRef = useRef<{
        startTime: number;
        trackId: string;
        duration: number;
    } | null>(null);

    // Initial Load - LocalStorage + API Sync
    useEffect(() => {
        // Load Local Storage first for speed
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

        // Fetch User Data from DB if logged in
        if (session?.user?.email) {
            // Fetch History
            fetch('/api/user/history')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setListeningHistory(data);
                })
                .catch(err => console.error('Error fetching history:', err));

            // Fetch Likes
            fetch('/api/user/likes')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setLikedSongs(data);
                })
                .catch(err => console.error('Error fetching likes:', err));
        }
    }, [session]);

    // Persist Listening History to LocalStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && listeningHistory.length > 0) {
            localStorage.setItem(LISTENING_HISTORY_KEY, JSON.stringify(listeningHistory));
        }
    }, [listeningHistory]);

    // Save to History Logic
    const saveToListeningHistory = (track: Track) => {
        // Optimistic update
        setListeningHistory(prev => {
            const filtered = prev.filter(t => t.id !== track.id);
            const newHistory = [track, ...filtered].slice(0, 50);
            return newHistory;
        });

        // Database Sync
        if (session?.user?.email) {
            fetch('/api/user/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(track)
            }).catch(e => console.error('DB History sync failed', e));
        }
    };

    // Record listening event for recommendation algorithm
    const recordListeningEvent = async (track: Track, playDuration: number, totalDuration: number, skipped: boolean) => {
        // Only record if played for at least 5 seconds
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
        // Optimistic update
        const isAlreadyLiked = likedSongs.some(t => t.id === track.id);

        let newLikedSongs = [];
        if (isAlreadyLiked) {
            newLikedSongs = likedSongs.filter(t => t.id !== track.id);
        } else {
            newLikedSongs = [track, ...likedSongs];
        }
        setLikedSongs(newLikedSongs);

        // Database Sync
        if (session?.user?.email) {
            fetch('/api/user/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(track)
            }).catch(e => {
                console.error('DB Like sync failed', e);
                // Ideally revert on failure, but for now we trust optimism
            });
        }
    };

    const isLiked = (trackId: string) => {
        return likedSongs.some(t => t.id === trackId);
    };

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
    }, []);

    const initPlayer = () => {
        if (playerRef.current) return;

        playerRef.current = new (window as any).YT.Player('youtube-audio-player', {
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 0,
                controls: 0,
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
            },
        });
    };

    const onPlayerReady = (event: any) => {
        event.target.setVolume(volume);
    };

    const onPlayerStateChange = (event: any) => {
        // 1 = Playing, 2 = Paused, 0 = Ended
        if (event.data === 1) {
            setIsPlaying(true);
            setIsLoading(false);
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                    setCurrentTime(playerRef.current.getCurrentTime());
                    setDuration(playerRef.current.getDuration() || 0);
                    // Update tracking ref with actual duration
                    if (trackingRef.current) {
                        trackingRef.current.duration = playerRef.current.getDuration() || 0;
                    }
                }
            }, 500);
        }
        if (event.data === 2) {
            setIsPlaying(false);
        }
        if (event.data === 0) {
            handleTrackEnd();
        }
    };

    const handleTrackEnd = useCallback(() => {
        // Record completion event
        if (currentTrack && trackingRef.current && trackingRef.current.trackId === currentTrack.id) {
            const playDuration = (Date.now() - trackingRef.current.startTime) / 1000;
            const totalDuration = duration || trackingRef.current.duration;
            recordListeningEvent(currentTrack, playDuration, totalDuration, false);
            trackingRef.current = null;
        }

        if (repeat === 'one' && currentTrack) {
            // Restart tracking for repeat
            trackingRef.current = {
                startTime: Date.now(),
                trackId: currentTrack.id,
                duration: duration
            };
            playerRef.current?.seekTo(0);
            playerRef.current?.playVideo();
        } else if (queue.length > 0) {
            playNext();
        } else if (repeat === 'all' && history.length > 0) {
            setIsPlaying(false);
        } else {
            setIsPlaying(false);
        }
    }, [repeat, queue, history, currentTrack, duration]);

    const playTrackInternal = (track: Track, previousTrack?: Track | null) => {
        // Record event for previous track if exists
        if (previousTrack && trackingRef.current && trackingRef.current.trackId === previousTrack.id) {
            const playDuration = (Date.now() - trackingRef.current.startTime) / 1000;
            const totalDuration = trackingRef.current.duration || duration;
            const skipped = playDuration < 30 && totalDuration > 30;
            recordListeningEvent(previousTrack, playDuration, totalDuration, skipped);
        }

        // Start tracking new track
        trackingRef.current = {
            startTime: Date.now(),
            trackId: track.id,
            duration: 0
        };

        setCurrentTrack(track);
        setIsLoading(true);
        setCurrentTime(0);
        saveToListeningHistory(track);
        if (playerRef.current && playerRef.current.loadVideoById) {
            playerRef.current.loadVideoById(track.id);
        }
    };

    const playTrack = (track: Track) => {
        const prevTrack = currentTrack;
        if (currentTrack) {
            setHistory(prev => [...prev, currentTrack]);
        }
        playTrackInternal(track, prevTrack);
    };

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

    const toggleShuffle = () => {
        setShuffle(prev => !prev);
    };

    const toggleRepeat = () => {
        setRepeat(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    };

    useEffect(() => {
        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
        };
    }, []);

    const reorderQueue = (fromIndex: number, toIndex: number) => {
        setQueue(prev => {
            const newQueue = [...prev];
            const [removed] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, removed);
            return newQueue;
        });
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            playTrack,
            togglePlay,
            volume,
            setVolume: updateVolume,
            isLoading,
            currentTime,
            duration,
            seekTo,
            queue,
            addToQueue,
            playNext,
            playPrevious,
            shuffle,
            toggleShuffle,
            repeat,
            toggleRepeat,
            listeningHistory,
            likedSongs,
            toggleLike,
            isLiked,
            isPlayerExpanded,
            togglePlayerExpansion,
            videoMode,
            toggleVideoMode,
            isVideoFullscreen,
            toggleVideoFullscreen,
            reorderQueue,
            loadMoreRecommendations
        }}>
            {children}
            {/* Video Player Container */}
            <div
                id="youtube-player-portal"
                onClick={togglePlay}
                className={`fixed inset-0 bg-black overflow-hidden transition-all duration-500 ${videoMode && isPlayerExpanded ? 'opacity-100 pointer-events-auto z-[60]' : 'opacity-0 pointer-events-none z-[-1] hidden'}`}
                style={{
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: isVideoFullscreen ? '100%' : 'calc(100% - 112px)',
                    paddingBottom: 0
                }}
            >
                <div className="w-full h-full pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full scale-[1.35] transform-gpu">
                        <div id="youtube-audio-player" className="w-full h-full" />
                    </div>
                </div>
            </div>
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
}
