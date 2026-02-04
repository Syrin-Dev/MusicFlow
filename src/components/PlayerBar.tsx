'use client';

import { useState } from 'react';
import { useAudio } from './AudioProvider';
import { AddToPlaylist } from './AddToPlaylist';
import { useRouter } from 'next/navigation';

// Format seconds to mm:ss
function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
    const {
        // ... existing destructuring
        currentTrack,
        isPlaying,
        togglePlay,
        volume,
        setVolume,
        isLoading,
        currentTime,
        duration,
        seekTo,
        playNext,
        playPrevious,
        shuffle,
        toggleShuffle,
        repeat,
        toggleRepeat,
        toggleLike,
        isLiked,
        togglePlayerExpansion,
        isPlayerExpanded,
        isConnectOpen,
        openConnect,
        closeConnect,
        connectInitialTrack
    } = useAudio();

    const router = useRouter();


    // No local state for likes needed anymore!
    const liked = currentTrack ? isLiked(currentTrack.id) : false;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        seekTo(percentage * duration);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (currentTrack) {
            if (img.src.includes('maxresdefault')) {
                img.src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
            } else if (img.src.includes('hqdefault')) {
                img.src = `https://i.ytimg.com/vi/${currentTrack.id}/mqdefault.jpg`;
            }
        }
    };

    const handleArtistClick = () => {
        if (currentTrack?.artist) {
            router.push(`/artist/${encodeURIComponent(currentTrack.artist)}`);
        }
    };

    if (!currentTrack || isPlayerExpanded) {
        // ... existing empty/hidden state logic
        if (!currentTrack) {
            return (
                <div suppressHydrationWarning className="fixed bottom-0 left-0 right-0 h-24 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center z-50">
                    <p className="text-gray-500 text-sm">Select a song to play</p>
                </div>
            );
        }
        return null;
    }

    return (
        <div suppressHydrationWarning className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
            <div className="glassmorphism rounded-2xl p-3 flex items-center justify-between shadow-2xl pointer-events-auto border border-white/10 mx-auto max-w-screen-2xl">
                {/* Left: Track Info */}
                {/* ... existing left section ... */}
                <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
                    <div className="relative group">
                        <img
                            alt={currentTrack.title}
                            className="w-12 h-12 rounded-md shadow-md object-cover"
                            src={`https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                            onError={handleImageError}
                        />
                        <div
                            className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md transition cursor-pointer"
                            onClick={togglePlayerExpansion}
                        >
                            <span className="material-icons-round text-white text-xl">expand_less</span>
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <div
                                className="text-white font-bold text-sm hover:underline cursor-pointer truncate max-w-[150px]"
                                onClick={togglePlayerExpansion}
                            >
                                {currentTrack.title}
                            </div>
                            <button onClick={() => toggleLike(currentTrack)}>
                                <span className={`material-icons-round text-xs cursor-pointer hover:text-white ${liked ? 'text-primary' : 'text-gray-400'}`}>favorite</span>
                            </button>
                        </div>
                        <span
                            className="text-xs text-gray-400 hover:text-white cursor-pointer hover:underline truncate"
                            onClick={handleArtistClick}
                        >
                            {currentTrack.artist}
                        </span>
                    </div>
                </div>

                {/* Center: Controls & Progress */}
                {/* ... existing center section (unchanged) ... */}
                <div className="flex flex-col items-center flex-1 max-w-2xl px-8">
                    <div className="flex items-center gap-6 mb-1">
                        <button
                            className={`transition ${shuffle ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                            onClick={toggleShuffle}
                        >
                            <span className="material-icons-round text-xl">shuffle</span>
                        </button>
                        <button
                            className="text-gray-300 hover:text-white transition"
                            onClick={playPrevious}
                        >
                            <span className="material-icons-round text-2xl">skip_previous</span>
                        </button>
                        <button
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg shadow-white/20"
                            onClick={togglePlay}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-icons-round text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            )}
                        </button>
                        <button
                            className="text-gray-300 hover:text-white transition"
                            onClick={playNext}
                        >
                            <span className="material-icons-round text-2xl">skip_next</span>
                        </button>
                        <button
                            className={`transition ${repeat !== 'off' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                            onClick={toggleRepeat}
                        >
                            <span className="material-icons-round text-xl">{repeat === 'one' ? 'repeat_one' : 'repeat'}</span>
                        </button>
                    </div>

                    <div className="w-full flex items-center gap-3 text-xs font-medium text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <div
                            className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group relative"
                            onClick={handleSeek}
                        >
                            <div
                                className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                                style={{ width: `${progress}%` }}
                            ></div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow shadow-black/50 transition-opacity"
                                style={{ left: `calc(${progress}% - 6px)` }}
                            ></div>
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>


                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
                    <button
                        className="text-gray-400 hover:text-primary transition p-2 hover:bg-white/5 rounded-full"
                        onClick={() => openConnect(currentTrack)}
                        title="Share to Friend"
                    >
                        <span className="material-icons-round text-xl">send</span>
                    </button>

                    <AddToPlaylist track={currentTrack} />

                    <div className="flex items-center gap-2 group w-24">
                        <button onClick={() => setVolume(volume === 0 ? 100 : 0)}>
                            <span className="material-icons-round text-gray-400 text-xl">
                                {volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                            </span>
                        </button>
                        <div className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer relative group-volume">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="absolute top-0 left-0 h-full bg-white group-hover:bg-primary rounded-full transition-colors"
                                style={{ width: `${volume}%` }}
                            ></div>
                        </div>
                    </div>

                    <button
                        className="text-gray-400 hover:text-white transition ml-2"
                        onClick={togglePlayerExpansion}
                        title="Expand"
                    >
                        <span className="material-icons-round text-3xl">keyboard_arrow_up</span>
                    </button>
                </div>
            </div>

        </div>
    );
}
