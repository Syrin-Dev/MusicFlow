
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
