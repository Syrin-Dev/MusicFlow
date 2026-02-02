import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let isInitialized = false;

interface SearchResult {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

async function ensureInitialized() {
    if (!isInitialized) {
        await ytmusic.initialize();
        isInitialized = true;
    }
}

// Helper to get the best thumbnail
function getHighQualityThumbnail(id: string, thumbnails?: any[], isPlaylist = false): string {
    if (thumbnails && thumbnails.length > 0) {
        // Sort by width descending to get the best quality
        const sorted = [...thumbnails].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
        const best = sorted[0];

        if (best?.url) {
            // Force high resolution dimensions
            return best.url.replace(/w\d+-h\d+/, 'w1200-h1200').replace(/=w\d+-h\d+/, '=w1200-h1200');
        }
    }

    // Fallback for videos - use YouTube thumbnail
    if (!isPlaylist && id) {
        return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    }

    // Fallback for playlists - use a gradient placeholder
    return 'https://i.ibb.co/kgVzCBV/playlist-placeholder.png';
}

export async function searchMusic(query: string): Promise<SearchResult[]> {
    try {
        await ensureInitialized();

        const results = await ytmusic.searchSongs(query);

        return results.slice(0, 20).map((song: any) => ({
            id: song.videoId,
            title: song.name || song.title || 'Unknown',
            artist: song.artist?.name || song.artists?.[0]?.name || 'Unknown Artist',
            thumbnail: getHighQualityThumbnail(song.videoId, song.thumbnails),
        }));
    } catch (error) {
        console.error('YTMusic Search Error:', error);
        return [];
    }
}

export async function searchPlaylists(query: string): Promise<SearchResult[]> {
    try {
        await ensureInitialized();
        const results = await ytmusic.searchPlaylists(query) as any[];

        // Debug: log first result to see structure
        if (results.length > 0) {
            console.log('Playlist search result sample:', JSON.stringify(results[0], null, 2));
        }

        return results.slice(0, 10)
            .map((item: any) => {
                // Try all possible ID properties
                const id = item.playlistId || item.albumId || item.browseId || item.id || item.videoId;
                return {
                    id,
                    title: item.name || item.title || 'Unknown Playlist',
                    artist: 'Playlist',
                    thumbnail: getHighQualityThumbnail(id, item.thumbnails, true),
                };
            })
            .filter((item) => item.id); // Remove items without valid ID
    } catch (error) {
        console.error('YTMusic Playlist Search Error:', error);
        return [];
    }
}

export async function getSuggestions(query: string): Promise<string[]> {
    try {
        await ensureInitialized();
        const suggestions = await ytmusic.getSearchSuggestions(query);
        return suggestions;
    } catch (error) {
        console.error('YTMusic Suggestions Error:', error);
        return [];
    }
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
    try {
        await ensureInitialized();
        const results = await ytmusic.searchAlbums(query) as any[];

        // Debug: log first result
        if (results.length > 0) {
            console.log('Album search result sample:', JSON.stringify(results[0], null, 2));
        }

        return results.slice(0, 10)
            .map((item: any) => {
                const id = item.albumId || item.browseId || item.id;
                // Use the thumbnail URL directly if available
                let thumbnailUrl = '';
                if (item.thumbnails && item.thumbnails.length > 0) {
                    // Get the largest thumbnail
                    const sorted = [...item.thumbnails].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                    const baseUrl = sorted[0]?.url || '';
                    // Force high resolution for Google images (lh3.googleusercontent.com)
                    thumbnailUrl = baseUrl.replace(/=w\d+-h\d+-/, '=w1200-h1200-');
                }

                return {
                    id,
                    title: item.name || item.title || 'Unknown Album',
                    artist: item.artist?.name || item.artists?.[0]?.name || 'Unknown Artist',
                    thumbnail: thumbnailUrl,
                };
            })
            .filter((item) => item.id);
    } catch (error) {
        console.error('YTMusic Album Search Error:', error);
        return [];
    }
}

export async function getPlaylistDetails(id: string) {
    try {
        await ensureInitialized();

        // 1. Try as Album if ID looks like an album (OLAK..., MPRE...)
        if (id.startsWith('OLAK') || id.startsWith('MPRE')) {
            try {
                const album = await ytmusic.getAlbum(id) as any;
                console.log('Album response keys:', Object.keys(album));
                return {
                    id: album.albumId || id,
                    title: album.title || album.name,
                    description: 'Album',
                    thumbnail: getHighQualityThumbnail(id, album.thumbnails, true),
                    channelTitle: album.artist?.name || album.artists?.[0]?.name || 'Unknown Artist',
                    tracks: (album.songs || album.tracks || []).map((song: any) => ({
                        id: song.videoId,
                        title: song.name || song.title,
                        artist: song.artist?.name || album.artist?.name || 'Unknown',
                        thumbnail: getHighQualityThumbnail(song.videoId, song.thumbnails),
                        duration: song.duration || song.length // duration might be string "3:25" or mapped elsewhere
                    })).filter((t: any) => t.id)
                };
            } catch (e) {
                console.log("Failed as album, trying playlist fallback...", e);
            }
        }

        // 2. Default / Fallback: Try as Playlist
        const playlist = await ytmusic.getPlaylist(id) as any;

        // IMPORTANT: getPlaylist only returns metadata, NOT tracks!
        // We need to call getPlaylistVideos separately to get the tracks
        const playlistVideos = await ytmusic.getPlaylistVideos(id) as any[];

        console.log('Playlist videos count:', playlistVideos?.length || 0);

        return {
            id: playlist.playlistId || id,
            title: playlist.name || playlist.title,
            description: playlist.description || '',
            thumbnail: getHighQualityThumbnail(playlist.playlistId, playlist.thumbnails, true),
            channelTitle: playlist.author?.name || playlist.artist?.name || 'YouTube Music',
            tracks: (playlistVideos || []).map((item: any) => ({
                id: item.videoId,
                title: item.name || item.title,
                artist: item.artist?.name || item.artists?.[0]?.name || 'Unknown',
                thumbnail: getHighQualityThumbnail(item.videoId, item.thumbnails),
                duration: item.duration || item.length
            })).filter((t: any) => t.id)
        };
    } catch (error) {
        console.error('YTMusic Get Detail Error:', error);
        return null;
    }
}
