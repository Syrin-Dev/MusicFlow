
import { MusicSource, UnifiedTrack } from '../types/music';

const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.otter.sh',
    'https://api.piped.kavin.rocks',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncp.in'
];

export class PipedSource implements MusicSource {
    name = 'youtube';
    private currentInstanceIndex = 0;

    private async fetchWithRotation(url: string, options?: RequestInit): Promise<Response> {
        let attempts = 0;
        const maxAttempts = PIPED_INSTANCES.length;

        while (attempts < maxAttempts) {
            const instance = PIPED_INSTANCES[this.currentInstanceIndex];
            try {
                const res = await fetch(`${instance}${url}`, options);
                if (res.ok) return res;
                // If 429 or 5xx, rotate
                if (res.status === 429 || res.status >= 500) throw new Error(`Status ${res.status}`);
            } catch (e) {
                console.warn(`Piped instance ${instance} failed:`, e);
                this.currentInstanceIndex = (this.currentInstanceIndex + 1) % PIPED_INSTANCES.length;
                attempts++;
            }
        }
        throw new Error('All Piped instances failed');
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            const res = await this.fetchWithRotation(`/search?q=${encodeURIComponent(query)}&filter=music_songs`);
            const data = await res.json();

            if (!data.items) return [];

            return data.items.map((item: any) => ({
                id: item.url.replace('/watch?v=', ''),
                title: item.title,
                artist: item.uploaderName || item.uploader || 'Unknown Artist',
                thumbnail: item.thumbnail,
                duration: item.duration || 0,
                isVerified: item.uploaderVerified || false,
                platform: 'youtube',
                sources: {
                    youtubeId: item.url.replace('/watch?v=', '')
                }
            }));
        } catch (e) {
            console.error('Piped Search Error:', e);
            return [];
        }
    }
}
