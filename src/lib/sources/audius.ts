
import { MusicSource, UnifiedTrack } from '../types/music';

export class AudiusSource implements MusicSource {
    name = 'audius';
    private host: string | null = null;

    private async getHost(): Promise<string> {
        if (this.host) return this.host;
        try {
            const res = await fetch('https://api.audius.co');
            const data = await res.json();
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                 this.host = data.data[0];
                 return this.host!;
            }
        } catch (e) {
            console.error('Audius Host Discovery Failed', e);
        }
        return 'https://discoveryprovider.audius.co'; // Fallback
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            const host = await this.getHost();
            const res = await fetch(`${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=Hievly`);
            const data = await res.json();

            if (!data.data) return [];

            return data.data.map((item: any) => ({
                id: `audius-${item.id}`,
                title: item.title,
                artist: item.user?.name || 'Unknown Artist',
                thumbnail: item.artwork ? item.artwork['480x480'] || item.artwork['150x150'] : '',
                duration: item.duration,
                isVerified: item.user?.is_verified || false,
                platform: 'audius',
                sources: {
                    audiusId: item.id
                }
            }));

        } catch (e) {
            console.error('Audius Search Error:', e);
            return [];
        }
    }
}
