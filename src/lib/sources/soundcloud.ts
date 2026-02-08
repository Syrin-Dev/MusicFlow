
import { MusicSource, UnifiedTrack } from '../types/music';

// Fallback client ID if scraping fails (often changes, but good to have one)
const FALLBACK_CLIENT_ID = 'your_client_id_here';

export class SoundCloudSource implements MusicSource {
    name = 'soundcloud';
    private clientId: string | null = null;

    private async getClientId(): Promise<string> {
        if (this.clientId) return this.clientId;

        try {
            // Scrape logic: fetch SC homepage, find script src, fetch script, extract client_id
            // Simplified for now: just return a known ID or fail gracefully if we can't scrape
            // Real implementation requires fetching https://soundcloud.com/discover, parsing HTML for <script src="...">,
            // fetching the JS file, and regexing for client_id:"..."

            // For this environment without full browser context, direct scraping is hard.
            // We'll rely on a known public client_id or a service if available.
            // Let's assume we can fetch the main page.

            const res = await fetch('https://soundcloud.com/discover');
            const text = await res.text();
            const scriptMatches = text.match(/<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)">/g);

            if (scriptMatches) {
                 for (const match of scriptMatches) {
                     const url = match.match(/src="([^"]+)"/)?.[1];
                     if (url) {
                         const jsRes = await fetch(url);
                         const jsText = await jsRes.text();
                         const idMatch = jsText.match(/client_id:"([^"]+)"/);
                         if (idMatch) {
                             this.clientId = idMatch[1];
                             return this.clientId;
                         }
                     }
                 }
            }
        } catch (e) {
            console.warn('SoundCloud Client ID scraping failed:', e);
        }

        return FALLBACK_CLIENT_ID;
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            const clientId = await this.getClientId();
            if (!clientId || clientId === 'your_client_id_here') return []; // scraping failed

            const res = await fetch(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=10`);
            const data = await res.json();

            if (!data.collection) return [];

            return data.collection.map((item: any) => ({
                id: `sc-${item.id}`,
                title: item.title,
                artist: item.user?.username || 'Unknown Artist',
                thumbnail: item.artwork_url?.replace('large', 't500x500') || '', // Upgrade quality
                duration: Math.floor(item.duration / 1000),
                isVerified: item.user?.verified || false,
                platform: 'soundcloud',
                sources: {
                    soundcloudId: item.id.toString()
                }
            }));

        } catch (e) {
            console.error('SoundCloud Search Error:', e);
            return [];
        }
    }
}
