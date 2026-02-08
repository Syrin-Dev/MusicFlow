
export interface TrackSources {
    youtubeId?: string;
    soundcloudId?: string;
    audiusId?: string;
}

export interface UnifiedTrack {
    id: string; // Primary ID (e.g., YouTube ID or generated UUID)
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    sources: TrackSources;
    isVerified: boolean;
    platform: 'youtube' | 'soundcloud' | 'audius' | 'mixed';
}

export interface MusicSource {
    name: string;
    search(query: string): Promise<UnifiedTrack[]>;
}

// Helper to convert legacy/partial track objects to UnifiedTrack
export function toUnifiedTrack(track: any): UnifiedTrack {
    // If it's already a UnifiedTrack (has sources), return it
    if (track.sources) return track as UnifiedTrack;

    // Handle string duration "MM:SS" -> seconds
    let duration = 0;
    if (typeof track.duration === 'string') {
        const parts = track.duration.split(':').map(Number);
        if (parts.length === 2) duration = parts[0] * 60 + parts[1];
        else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (typeof track.duration === 'number') {
        duration = track.duration;
    }

    // Default to YouTube if unknown
    return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail || '',
        duration: duration,
        sources: { youtubeId: track.id }, // Assume ID is YouTube ID
        isVerified: false,
        platform: 'youtube'
    };
}
