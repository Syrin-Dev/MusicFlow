import YTMusic from 'ytmusic-api';
import { unstable_cache } from 'next/cache';

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
            // Check if it's a googleusercontent URL (support resizing)
            if (best.url.includes('googleusercontent.com')) {
                return best.url.replace(/w\d+-h\d+/, 'w544-h544').replace(/=w\d+-h\d+/, '=w544-h544');
            }
            // For ytimg, return as is (usually leads to valid URL)
            return best.url;
        }
    }

    // Fallback for videos - try maxres, but component should handle error
    if (!isPlaylist && id) {
        return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    // Fallback for playlists
    return 'https://i.ibb.co/kgVzCBV/playlist-placeholder.png';
}

const CACHE_TTL = 3600; // 1 hour

export const searchMusic = unstable_cache(
    async (query: string): Promise<SearchResult[]> => {
        try {
            await ensureInitialized();
            const results = await ytmusic.searchSongs(query);

            const mapped = results.slice(0, 20).map((song: any) => ({
                id: song.videoId,
                title: song.name || song.title || 'Unknown',
                artist: song.artist?.name || song.artists?.[0]?.name || 'Unknown Artist',
                thumbnail: getHighQualityThumbnail(song.videoId, song.thumbnails),
            })).filter(song =>
                song.id &&
                song.title !== 'Unknown' &&
                song.artist !== 'Unknown Artist'
            );
            return mapped;
        } catch (error) {
            console.error('YTMusic Search Error:', error);
            return [];
        }
    },
    ['search-music'],
    { revalidate: CACHE_TTL }
);

export const searchPlaylists = unstable_cache(
    async (query: string): Promise<SearchResult[]> => {
        try {
            await ensureInitialized();
            const results = await ytmusic.searchPlaylists(query) as any[];

            return results.slice(0, 10)
                .map((item: any) => {
                    const id = item.playlistId || item.albumId || item.browseId || item.id || item.videoId;
                    return {
                        id,
                        title: item.name || item.title || 'Unknown Playlist',
                        artist: 'Playlist',
                        thumbnail: getHighQualityThumbnail(id, item.thumbnails, true),
                    };
                })
                .filter((item) => item.id);
        } catch (error) {
            console.error('YTMusic Playlist Search Error:', error);
            return [];
        }
    },
    ['search-playlists'],
    { revalidate: CACHE_TTL }
);

export const getSuggestions = unstable_cache(
    async (query: string): Promise<string[]> => {
        try {
            await ensureInitialized();
            const suggestions = await ytmusic.getSearchSuggestions(query);
            return suggestions;
        } catch (error) {
            console.error('YTMusic Suggestions Error:', error);
            return [];
        }
    },
    ['get-suggestions'],
    { revalidate: CACHE_TTL }
);

export const searchAlbums = unstable_cache(
    async (query: string): Promise<SearchResult[]> => {
        try {
            await ensureInitialized();
            const results = await ytmusic.searchAlbums(query) as any[];

            return results.slice(0, 10)
                .map((item: any) => {
                    const id = item.albumId || item.browseId || item.id;
                    let thumbnailUrl = '';
                    if (item.thumbnails && item.thumbnails.length > 0) {
                        const sorted = [...item.thumbnails].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                        const baseUrl = sorted[0]?.url || '';
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
    },
    ['search-albums'],
    { revalidate: CACHE_TTL }
);

export const getPlaylistDetails = unstable_cache(
    async (id: string) => {
        try {
            await ensureInitialized();

            if (id.startsWith('OLAK') || id.startsWith('MPRE') || id.startsWith('MPT') || !id.startsWith('PL')) {
                try {
                    const album = await ytmusic.getAlbum(id) as any;
                    if (album && (album.songs || album.tracks || []).length > 0) {
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
                                duration: song.duration || song.length
                            })).filter((t: any) => t.id)
                        };
                    }
                } catch (e) {
                    // console.log("Failed as album, trying playlist fallback...", e);
                }
            }

            const playlist = await ytmusic.getPlaylist(id) as any;
            const playlistVideos = await ytmusic.getPlaylistVideos(id) as any[];

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
    },
    ['get-playlist-details'],
    { revalidate: CACHE_TTL }
);

export const getArtistData = unstable_cache(
    async (name: string) => {
        try {
            await ensureInitialized();

            const searchResults = await ytmusic.searchArtists(name);
            if (!searchResults || searchResults.length === 0) {
                return null;
            }

            const artistInfo = searchResults[0];
            const artistId = (artistInfo as any).browseId || (artistInfo as any).artistId;

            const artistDetails = await ytmusic.getArtist(artistId) as any;

            const topSongs = artistDetails.topSongs || artistDetails.sections?.find((s: any) => s.title === 'Songs' || s.title === 'Top songs')?.results || [];
            const albums = artistDetails.topAlbums || artistDetails.sections?.find((s: any) => s.title === 'Albums')?.results || [];
            const singles = artistDetails.topSingles || artistDetails.sections?.find((s: any) => s.title === 'Singles')?.results || [];
            const related = artistDetails.similarArtists || artistDetails.sections?.find((s: any) => s.title === 'Fans might also like')?.results || [];

            let realEvents: any[] = [];
            try {
                const bitRes = await fetch(`https://rest.bandsintown.com/artists/${encodeURIComponent(artistInfo.name)}/events?app_id=squarespace-tours-v6&date=upcoming`);
                if (bitRes.ok) {
                    const bitData = await bitRes.json();
                    if (Array.isArray(bitData)) {
                        realEvents = bitData.slice(0, 5).map((evt: any) => {
                            const dateObj = new Date(evt.datetime);
                            const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                            const day = dateObj.getDate().toString().padStart(2, '0');

                            return {
                                id: evt.id,
                                date: `${month} ${day}`,
                                venue: evt.venue?.name || 'Unknown Venue',
                                location: `${evt.venue?.city || ''}, ${evt.venue?.country || ''}`,
                                url: evt.url
                            };
                        });
                    }
                }
            } catch (e) {
                // Fail silently
            }

            const merchItems = [
                {
                    title: `${artistInfo.name} Tour T-Shirt`,
                    price: 'Check Store',
                    image: artistInfo.thumbnails?.[0]?.url || '',
                    url: `https://www.redbubble.com/shop/${encodeURIComponent(artistInfo.name + ' t-shirt')}`
                },
                {
                    title: 'Limited Edition Vinyl',
                    price: 'Check Store',
                    image: albums[0]?.thumbnail || artistInfo.thumbnails?.[0]?.url || '',
                    url: `https://www.amazon.com/s?k=${encodeURIComponent(artistInfo.name + ' vinyl')}`
                }
            ];

            return {
                id: artistId,
                name: artistInfo.name,
                description: artistDetails.description || '',
                subscribers: artistDetails.subscribers || '',
                thumbnail: getHighQualityThumbnail(artistId, artistInfo.thumbnails),
                background: getHighQualityThumbnail(artistId, artistInfo.thumbnails).replace('w1200-h1200', 'w2560-h1440'),
                topSongs: topSongs.map((song: any) => ({
                    id: song.videoId,
                    title: song.title || song.name,
                    artist: artistInfo.name,
                    album: song.album?.name || (song.album as any)?.title,
                    duration: song.duration,
                    thumbnail: getHighQualityThumbnail(song.videoId, song.thumbnails),
                    plays: song.plays
                })).slice(0, 50),
                albums: albums.map((album: any) => ({
                    id: album.albumId || album.browseId || album.playlistId,
                    title: album.title || album.name,
                    year: album.year,
                    thumbnail: getHighQualityThumbnail(album.browseId, album.thumbnails, true),
                    type: 'Album'
                })),
                singles: singles.map((single: any) => ({
                    id: single.albumId || single.browseId || single.playlistId,
                    title: single.title || single.name,
                    year: single.year,
                    thumbnail: getHighQualityThumbnail(single.browseId, single.thumbnails, true),
                    type: 'Single'
                })),
                videos: (artistDetails.topVideos || artistDetails.sections?.find((s: any) => s.title === 'Videos')?.results || []).map((video: any) => ({
                    id: video.videoId,
                    title: video.title || video.name,
                    year: video.year,
                    thumbnail: getHighQualityThumbnail(video.videoId, video.thumbnails, true),
                    type: 'Video',
                    views: video.views
                })),
                related: related.map((artist: any) => ({
                    id: artist.browseId || artist.artistId,
                    name: artist.name,
                    thumbnail: getHighQualityThumbnail(artist.browseId, artist.thumbnails)
                })).slice(0, 4),
                events: realEvents,
                merch: {
                    title: `${artistInfo.name} Official Merch`,
                    items: merchItems
                }
            };

        } catch (error) {
            console.error('YTMusic Artist Data Error:', error);
            return null;
        }
    },
    ['get-artist-data'],
    { revalidate: CACHE_TTL }
);
