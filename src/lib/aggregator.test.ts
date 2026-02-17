
import { describe, it, expect } from 'bun:test';
import { searchUnified } from './aggregator';
import { UnifiedTrack, MusicSource } from './types/music';

// Mock Sources
class MockYouTube implements MusicSource {
    name = 'youtube';
    async search(q: string): Promise<UnifiedTrack[]> {
        return [{
            id: 'yt1',
            title: 'Test Song',
            artist: 'Test Artist',
            platform: 'youtube',
            sources: { youtubeId: 'yt1' },
            isVerified: true,
            thumbnail: 'yt-thumb',
            duration: 200
        }];
    }
}

class MockSoundCloud implements MusicSource {
    name = 'soundcloud';
    async search(q: string): Promise<UnifiedTrack[]> {
        return [{
            id: 'sc1',
            title: 'Test Song (Official Audio)', // Slightly different title
            artist: 'Test Artist',
            platform: 'soundcloud',
            sources: { soundcloudId: 'sc1' },
            isVerified: false,
            thumbnail: 'sc-thumb',
            duration: 200
        }];
    }
}

class MockAudius implements MusicSource {
    name = 'audius';
    async search(q: string): Promise<UnifiedTrack[]> {
        return [{
            id: 'au1',
            title: 'Completely Different Song',
            artist: 'Other Artist',
            platform: 'audius',
            sources: { audiusId: 'au1' },
            isVerified: false,
            thumbnail: 'au-thumb',
            duration: 180
        }];
    }
}

describe('Smart Aggregator', () => {
    it('merges similar tracks from different sources', async () => {
        const sources = [new MockYouTube(), new MockSoundCloud(), new MockAudius()];
        const results = await searchUnified('test song', sources);

        // Should merge YT and SC (fuzzy match)
        // Should keep Audius separate
        expect(results.length).toBe(2);

        const merged = results.find(t => t.title.includes('Test Song'));
        expect(merged).toBeDefined();
        if (merged) {
            // Check Source Merging
            expect(merged.sources.youtubeId).toBe('yt1');
            expect(merged.sources.soundcloudId).toBe('sc1');

            // Check Metadata Prioritization (YouTube Verified > SC Unverified)
            expect(merged.platform).toBe('youtube');
            expect(merged.isVerified).toBe(true);
            expect(merged.thumbnail).toBe('yt-thumb');
        }
    });
});
