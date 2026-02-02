'use client';

import { useAudio } from './AudioProvider';
import { AddToPlaylist } from './AddToPlaylist';

// Format seconds to mm:ss
function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
    const {
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
    } = useAudio();

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

    if (!currentTrack || isPlayerExpanded) {
        if (!currentTrack) {
            return (
                <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center z-50">
                    <p className="text-gray-500 text-sm">Select a song to play</p>
                </div>
            );
        }
        return null; // Hide mini player when expanded
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0A0A0B]/70 backdrop-blur-xl border-t border-white/10 px-6 z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] supports-[backdrop-filter]:bg-[#0A0A0B]/70 transition-all duration-300">
            <div className="flex items-center justify-between h-full max-w-screen-2xl mx-auto">
                {/* Left - Track Info */}
                <div className="flex items-center gap-4 w-[300px] min-w-[200px]">
                    <div className="relative group">
                        <img
                            src={`https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                            alt={currentTrack.title}
                            onError={handleImageError}
                            className="w-14 h-14 rounded-lg object-cover shadow-lg"
                        />
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm truncate">
                            {currentTrack.title}
                        </h4>
                        <p className="text-gray-400 text-xs truncate">
                            {currentTrack.artist}
                        </p>
                    </div>
                    {/* Like button - heart */}
                    <button
                        onClick={() => toggleLike(currentTrack)}
                        className={`p-2 transition-colors ${liked ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-[#8B5CF6]'}`}
                    >
                        <svg
                            className="w-5 h-5"
                            fill={liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    {/* Add to Playlist button */}
                    <AddToPlaylist track={currentTrack} />
                    {/* Expand button - arrow up */}
                    <button
                        onClick={togglePlayerExpansion}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Expand player"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>

                {/* Center - Controls & Progress */}
                <div className="flex-1 max-w-2xl flex flex-col items-center gap-2">
                    {/* Controls */}
                    <div className="flex items-center gap-6">
                        {/* Shuffle */}
                        <button
                            onClick={toggleShuffle}
                            className={`p-2 transition-colors ${shuffle ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-white'}`}
                            title="Shuffle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>

                        {/* Previous */}
                        <button
                            onClick={playPrevious}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Previous"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? (
                                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={playNext}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Next"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zm2 0V6l6.5 6L8 18zm8-12h2v12h-2V6z" />
                            </svg>
                        </button>

                        {/* Repeat */}
                        <button
                            onClick={toggleRepeat}
                            className={`p-2 transition-colors relative ${repeat !== 'off' ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-white'}`}
                            title={repeat === 'one' ? 'Repeat One' : repeat === 'all' ? 'Repeat All' : 'Repeat Off'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {repeat === 'one' && (
                                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-[#8B5CF6]">1</span>
                            )}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                        <div
                            className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
                            onClick={handleSeek}
                        >
                            {/* Progress */}
                            <div
                                className="absolute left-0 top-0 h-full bg-[#8B5CF6] rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                            {/* Hover dot */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg transition-opacity"
                                style={{ left: `calc(${progress}% - 6px)` }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 w-10 tabular-nums">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right - Volume & Queue */}
                <div className="flex items-center gap-4 w-[300px] justify-end">
                    {/* Queue */}
                    <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Queue">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setVolume(volume === 0 ? 100 : 0)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            {volume === 0 ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #8B5CF6 ${volume}%, rgba(255,255,255,0.1) ${volume}%)`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
