import { google } from 'googleapis';

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

export interface SearchResult {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

export async function searchMusic(query: string): Promise<SearchResult[]> {
    try {
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            videoCategoryId: '10', // Music
            type: ['video'],
            maxResults: 20,
        });

        return (response.data.items || []).map((item) => ({
            id: item.id?.videoId || '',
            title: item.snippet?.title || '',
            artist: item.snippet?.channelTitle || '',
            thumbnail: item.snippet?.thumbnails?.high?.url || '',
        }));
    } catch (error) {
        console.error('YouTube Search API Error:', error);
        return [];
    }
}
