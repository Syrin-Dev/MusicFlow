
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
    // Handle string duration "MM:SS" -> seconds
    let duration = 0;
    if (typeof track.duration === 'string') {
        const parts = track.duration.split(':').map(Number);
        if (parts.length === 2) duration = parts[0] * 60 + parts[1];
        else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (typeof track.duration === 'number') {
        duration = track.duration;
    }

    // Get the track ID
    const trackId = track.id || track.videoId || '';

    // Check if sources already has a valid youtubeId
    const hasValidSources = track.sources && (
        track.sources.youtubeId ||
        track.sources.soundcloudId ||
        track.sources.audiusId
    );

    // Build sources - ALWAYS ensure youtubeId is set if track.id looks like a YouTube ID
    let sources: TrackSources;
    if (hasValidSources) {
        sources = track.sources;
    } else {
        // Default: assume the track.id IS a YouTube video ID
        sources = { youtubeId: trackId };
    }

    // Ensure thumbnail has fallback
    let thumbnail = track.thumbnail || '';
    if (!thumbnail && trackId && !trackId.startsWith('sc-') && !trackId.startsWith('audius-')) {
        thumbnail = `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`;
    }

    return {
        id: trackId,
        title: track.title || track.name || 'Unknown',
        artist: track.artist || track.artists?.[0]?.name || 'Unknown Artist',
        thumbnail,
        duration: duration || track.duration || 0,
        sources,
        isVerified: track.isVerified || false,
        platform: track.platform || 'youtube'
    };
}
