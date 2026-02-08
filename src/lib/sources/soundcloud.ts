import { MusicSource, UnifiedTrack } from '../types/music';

// Known working SoundCloud client IDs (scraped from their public JS)
// These rotate periodically but usually last weeks/months
const SOUNDCLOUD_CLIENT_IDS = [
    'iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX',
    'a3e059563d7fd3372b49b37f00a00bcf',
    '2t9loNQH90kzJcsFCODdigxfp325aq4z'
];

let workingClientId: string | null = null;

export class SoundCloudSource implements MusicSource {
    name = 'soundcloud';

    private async getWorkingClientId(): Promise<string | null> {
        if (workingClientId) return workingClientId;

        // Try each known client ID
        for (const clientId of SOUNDCLOUD_CLIENT_IDS) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);

                const res = await fetch(
                    `https://api-v2.soundcloud.com/search/tracks?q=test&client_id=${clientId}&limit=1`,
                    { signal: controller.signal }
                );
                clearTimeout(timeout);

                if (res.ok) {
                    workingClientId = clientId;
                    return clientId;
                }
            } catch {
                continue;
            }
        }

        // Try to scrape a fresh one from SC website
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const pageRes = await fetch('https://soundcloud.com', { signal: controller.signal });
            clearTimeout(timeout);

            const html = await pageRes.text();

            // Find script URLs
            const scriptUrls = html.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js/g);

            if (scriptUrls) {
                for (const url of scriptUrls.slice(0, 3)) {
                    try {
                        const jsRes = await fetch(url);
                        const js = await jsRes.text();
                        const match = js.match(/client_id:"([a-zA-Z0-9]+)"/);
                        if (match) {
                            workingClientId = match[1];
                            return workingClientId;
                        }
                    } catch {
                        continue;
                    }
                }
            }
        } catch (e) {
            console.warn('SoundCloud scraping failed:', e);
        }

        return null;
    }

    async search(query: string): Promise<UnifiedTrack[]> {
        try {
            const clientId = await this.getWorkingClientId();
            if (!clientId) {
                console.warn('SoundCloud: No working client_id');
                return [];
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(
                `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=10`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            if (!res.ok) {
                // Invalidate client ID on failure
                if (res.status === 401 || res.status === 403) {
                    workingClientId = null;
                }
                return [];
            }

            const data = await res.json();

            if (!data.collection || !Array.isArray(data.collection)) {
                return [];
            }

            return data.collection.map((item: any) => ({
                id: `sc-${item.id}`,
                title: item.title || 'Unknown',
                artist: item.user?.username || 'Unknown Artist',
                thumbnail: item.artwork_url
                    ? item.artwork_url.replace('-large', '-t500x500')
                    : (item.user?.avatar_url?.replace('-large', '-t500x500') || ''),
                duration: Math.floor((item.duration || 0) / 1000),
                isVerified: item.user?.verified || false,
                platform: 'soundcloud' as const,
                sources: {
                    soundcloudId: item.id?.toString()
                }
            })).filter((t: UnifiedTrack) => t.title !== 'Unknown');

        } catch (e) {
            console.error('SoundCloud Search Error:', e);
            return [];
        }
    }
}
