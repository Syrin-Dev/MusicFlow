const YTMusic = require('ytmusic-api');

const ytmusic = new YTMusic();

async function debugArtist(artistName) {
    try {
        await ytmusic.initialize();
        const searchResults = await ytmusic.searchArtists(artistName);
        if (searchResults.length > 0) {
            const artistId = searchResults[0].browseId;
            console.log(`Artist ID: ${artistId}`);
            const artist = await ytmusic.getArtist(artistId);
            console.log('Artist Keys:', Object.keys(artist));
            if (artist.sections) {
                console.log('Sections:', artist.sections.map(s => s.title));
            }
            // Check for specific event/concert data
            // console.log(JSON.stringify(artist, null, 2)); 
        } else {
            console.log('No artist found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

const artistName = process.argv[2] || "Eminem";
debugArtist(artistName);
