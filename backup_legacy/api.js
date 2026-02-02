/**
 * StreamFlow API Module
 * Handles YouTube Data Fetching (Real + Robust Mock Fallback)
 */

const API_KEY = ''; // Insert Key Here

class MusicAPI {
    constructor() {
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
        this.mockDelay = 500;
    }

    async search(query) {
        if (!API_KEY) return this.mockSearch(query);

        try {
            const res = await fetch(`${this.baseUrl}/search?part=snippet&maxResults=20&q=${query} music&type=video&key=${API_KEY}`);
            const data = await res.json();
            return data.items.map(item => this.normalize(item));
        } catch (e) {
            console.warn('API Error, falling back to mock:', e);
            return this.mockSearch(query);
        }
    }

    async getTopCharts() {
        // Simulating a "Global Top 10" fetch
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
                    { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', artist: 'Nirvana', thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg' },
                    { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
                    { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
                    { id: 'NotAFrealID1', title: 'Midnight City', artist: 'M83', thumbnail: 'https://i.ytimg.com/vi/dX3k_QDnzHE/hqdefault.jpg' },
                    { id: 'NotAFrealID2', title: 'Instant Crush', artist: 'Daft Punk', thumbnail: 'https://i.ytimg.com/vi/a5uQMwRMHcs/hqdefault.jpg' }
                ]);
            }, this.mockDelay);
        });
    }

    mockSearch(query) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Return generic results based on query to feel "responsive"
                const results = [];
                for (let i = 0; i < 8; i++) {
                    results.push({
                        id: `mock_${Math.random()}`,
                        title: `${query} - Track ${i + 1}`,
                        artist: `Artist ${i + 1}`,
                        thumbnail: `https://picsum.photos/seed/${query}${i}/300/300`
                    });
                }
                resolve(results);
            }, this.mockDelay);
        });
    }

    normalize(item) {
        return {
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        };
    }
}

window.api = new MusicAPI();
