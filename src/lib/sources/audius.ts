import { MusicSource, UnifiedTrack } from '../types/music';

// Audius discovery nodes - always get fresh list from main endpoint
const AUDIUS_MAIN_API = 'https://api.audius.co';

let cachedHost: string | null = null;
let hostFetchedAt = 0;
const HOST_CACHE_MS = 5 * 60 * 1000; // Cache host for 5 minutes

export class AudiusSource implements MusicSource {
    name = 'audius';

    private async getHost(): Promise<string> {
        const now = Date.now();

        // Use cached host if fresh
        if (cachedHost && (now - hostFetchedAt) < HOST_CACHE_MS) {
            return cachedHost;
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(AUDIUS_MAIN_API, { signal: controller.signal });
            clearTimeout(timeout);

            const data = await res.json();

            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                // Pick a random host to distribute load
                cachedHost = data.data[Math.floor(Math.random() * data.data.length)];
                hostFetchedAt = now;
                return cachedHost!;
            }
        } catch (e) {
            console.warn('Audius host discovery failed:', e);
        }

        // Fallback hosts
        const fallbacks = [
            'https://discoveryprovider.audius.co',
            'https://discoveryprovider2.audius.co',
            'https://discoveryprovider3.audius.co'
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            const host = await this.getHost();

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(
                `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=Hievly`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!res.ok) return [];

            const data = await res.json();

            if (!data.data || !Array.isArray(data.data)) {
                return [];
            }

            return data.data.slice(0, 10).map((item: any) => {
                // Get best artwork quality
                let thumbnail = '';
                if (item.artwork) {
                    thumbnail = item.artwork['1000x1000'] ||
                        item.artwork['480x480'] ||
                        item.artwork['150x150'] || '';
                }

                return {
                    id: `audius-${item.id}`,
                    title: item.title || 'Unknown',
                    artist: item.user?.name || 'Unknown Artist',
                    thumbnail,
                    duration: item.duration || 0,
                    isVerified: item.user?.is_verified || false,
                    platform: 'audius' as const,
                    sources: {
                        audiusId: item.id
                    }
                };
            }).filter((t: UnifiedTrack) => t.title !== 'Unknown');

        } catch (e) {
            console.error('Audius Search Error:', e);
            return [];
        }
    }
}
