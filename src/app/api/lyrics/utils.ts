
// Cleaning logic extracted from route.ts
export const cleanString = (str: string) => {
    return str
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        .replace(/official video/gi, '')
        .replace(/music video/gi, '')
        .replace(/lyrics/gi, '')
        .replace(/ft\./gi, '')
        .replace(/feat\./gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// Helper to check similarity
// Requires pre-cleaned searchArtist and searchTitle to be passed in
export const isMatch = (item: any, searchArtist: string, searchTitle: string) => {
    if (item.instrumental) return false; // Skip explicit instrumentals for now

    const itemArtist = cleanString(item.artistName || '').toLowerCase();
    const itemTitle = cleanString(item.trackName || '').toLowerCase();
    const searchArtistLower = searchArtist.toLowerCase();
    const searchTitleLower = searchTitle.toLowerCase();

    // Check if title contains the search title or vice versa
    const titleMatch = itemTitle.includes(searchTitleLower) || searchTitleLower.includes(itemTitle);

    // Check artist match (loose)
    // If no artist supplied in search, rely mostly on title
    const artistMatch = !searchArtistLower || itemArtist.includes(searchArtistLower) || searchArtistLower.includes(itemArtist);

    return titleMatch && artistMatch;
};
