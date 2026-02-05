
interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

// Helper to clean artist names
function cleanArtist(artist: string): string {
    if (!artist) return '';
    return artist.replace(/ - Topic|VEVO|Official|Official Channel/gi, '').trim();
}

function getTimeContextQuery(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning energy music';
    if (hour >= 12 && hour < 18) return 'daytime vibes music';
    if (hour >= 18 && hour < 22) return 'evening chill music';
    return 'late night lo-fi music';
}

export function generateSmartDiscoveryQueries(history: Track[]): string[] {
    const timeQuery = getTimeContextQuery();

    // Cold start with time context
    if (!history || history.length === 0) {
        return [
            timeQuery,
            'global top 50',
            'trending music 2024',
            'viral hits today',
            'new music friday'
        ];
    }

    const queries: string[] = [];
    const uniqueArtists = new Set<string>();
    const recentTracks = history.slice(0, 15);

    // Extract artists
    recentTracks.forEach(track => {
        const artist = cleanArtist(track.artist);
        if (artist.length > 1 && !artist.includes('Unknown')) {
            uniqueArtists.add(artist);
        }
    });

    const artists = Array.from(uniqueArtists);

    // 1. Deep Discovery (Similar Artists) - High Priority
    // Take the most recently played artist
    if (artists.length > 0) {
        const lastArtist = artists[0];
        queries.push(`${lastArtist} radio`);
        queries.push(`music similar to ${lastArtist}`);
        queries.push(`artists like ${lastArtist}`);
    }

    // 2. Contextual Mix (Time of Day + Taste)
    if (artists.length > 0) {
        // "Evening chill with [Artist]"
        const randomArtist = artists[Math.floor(Math.random() * artists.length)];
        queries.push(`${randomArtist} ${timeQuery.split(' ')[0]} vibes`);
    }

    // 3. Track-based discovery (Specific Song Radio)
    if (recentTracks.length > 0) {
        const track = recentTracks[0];
        queries.push(`songs like ${track.title} by ${cleanArtist(track.artist)}`);
    }

    // 4. Spread Discovery (Older history)
    // Don't just focus on the last song, look back a bit
    if (artists.length > 3) {
        const olderArtist = artists[2];
        queries.push(`${olderArtist} mix`);
    }

    // 5. Serendipity (Wildcard) - 20% chance to add a pure discovery query
    if (Math.random() > 0.8) {
        queries.push('undiscovered gems music');
        queries.push('rising artists 2024');
    }

    // Always mix in the time context as a fallback/spice
    queries.push(timeQuery);

    // Remove duplicates and empty strings
    return [...new Set(queries)].filter(q => q && q.length > 0);
}
