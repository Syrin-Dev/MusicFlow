'use client';

import { useState } from 'react';
import { useAudio } from '@/components/AudioProvider';
import { toUnifiedTrack } from '@/lib/types/music';

interface MusicCardProps {
    message: any;
    currentUserId: string;
}

export default function MusicCard({ message, currentUserId }: MusicCardProps) {
    const { playTrack } = useAudio();
    const isMe = message.senderId === currentUserId;

    if (!message.sharedMusicId) return null;

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`relative flex items-center p-3 rounded-2xl max-w-sm cursor-pointer group transition-all duration-300 transform hover:scale-[1.02] border ${isMe ? 'bg-primary/20 border-primary/30' : 'bg-white/10 border-white/10'}`}
                style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                }}
                onClick={() => playTrack(toUnifiedTrack({
                    id: message.sharedMusicId,
                    title: message.sharedMusicTitle,
                    artist: message.sharedMusicArtist,
                    thumbnail: message.sharedMusicImg
                }))}
            >
                {/* Album Art with Play Overlay */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg mr-4 flex-shrink-0">
                    <img src={message.sharedMusicImg} alt={message.sharedMusicTitle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-icons-round text-white text-2xl">play_arrow</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-white font-bold text-sm truncate">{message.sharedMusicTitle}</h4>
                    <p className="text-gray-300 text-xs truncate">{message.sharedMusicArtist}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="material-icons-round text-[10px] text-primary">music_note</span>
                        <span className="text-[10px] text-primary font-medium uppercase tracking-wider">MusicFlow Connect</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
