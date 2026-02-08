import { MusicSource, UnifiedTrack } from '../types/music';

// Tested, working Piped instances (2024)
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.darkness.services',
    'https://pipedapi.leptons.xyz'
];

// Singleton instance index (persists across requests in same process)
let currentInstanceIndex = 0;
let lastWorkingInstance: string | null = null;

export class PipedSource implements MusicSource {
    name = 'youtube';

    private async fetchWithRotation(path: string, timeoutMs = 5000): Promise<Response> {
        const maxAttempts = PIPED_INSTANCES.length;

        // Try last working instance first
        if (lastWorkingInstance) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutMs);

                const res = await fetch(`${lastWorkingInstance}${path}`, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeout);

                if (res.ok) return res;
            } catch {
                lastWorkingInstance = null;
            }
        }

        // Rotate through instances
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            const instance = PIPED_INSTANCES[currentInstanceIndex];

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutMs);

                const res = await fetch(`${instance}${path}`, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeout);

                if (res.ok) {
                    lastWorkingInstance = instance;
                    return res;
                }

                // Rotate on failure
                currentInstanceIndex = (currentInstanceIndex + 1) % PIPED_INSTANCES.length;
            } catch (e) {
                console.warn(`Piped ${instance} failed:`, e instanceof Error ? e.message : 'timeout');
                currentInstanceIndex = (currentInstanceIndex + 1) % PIPED_INSTANCES.length;
            }
        }

        throw new Error('All Piped instances failed');
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            // Use 'music' filter which works on most instances
            const res = await this.fetchWithRotation(
                `/search?q=${encodeURIComponent(query)}&filter=music`
            );
            const data = await res.json();

            if (!data.items || !Array.isArray(data.items)) {
                console.warn('Piped: No items in response');
                return [];
            }

            // Filter for actual videos (not channels/playlists)
            const videos = data.items.filter((item: any) =>
                item.type === 'stream' || item.url?.includes('/watch')
            );

            return videos.slice(0, 15).map((item: any) => {
                const videoId = item.url?.replace('/watch?v=', '') || item.videoId || '';

                return {
                    id: videoId,
                    title: item.title || 'Unknown',
                    artist: (item.uploaderName || item.uploader || 'Unknown Artist')
                        .replace(' - Topic', '')
                        .replace('VEVO', ''),
                    thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    duration: item.duration || 0,
                    isVerified: item.uploaderVerified || false,
                    platform: 'youtube' as const,
                    sources: {
                        youtubeId: videoId
                    }
                };
            }).filter((t: UnifiedTrack) => t.id && t.title !== 'Unknown');

        } catch (e) {
            console.error('Piped Search Error:', e);
            return [];
        }
    }
}
