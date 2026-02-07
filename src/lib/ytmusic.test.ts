import { describe, test, expect, mock, beforeEach, spyOn, afterAll } from 'bun:test';
import YTMusic from 'ytmusic-api';

// Spy on the prototype methods to intercept calls
const spyInitialize = spyOn(YTMusic.prototype, 'initialize');
const spySearchArtists = spyOn(YTMusic.prototype, 'searchArtists');
const spyGetArtist = spyOn(YTMusic.prototype, 'getArtist');

// Mock fetch globally
const originalFetch = global.fetch;
global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify([]), { status: 200 })));

// Import the function to test
import { getArtistData } from './ytmusic';

describe('getArtistData', () => {
    beforeEach(() => {
        // Reset spies
        spyInitialize.mockReset();
        spyInitialize.mockImplementation(() => Promise.resolve());

        spySearchArtists.mockReset();
        spyGetArtist.mockReset();

        // Reset fetch
        global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify([]), { status: 200 })));
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test('should return null when searchArtists returns no results', async () => {
        spySearchArtists.mockResolvedValue([]);

        const result = await getArtistData('NonExistentArtist');

        expect(result).toBeNull();
        expect(spySearchArtists).toHaveBeenCalledWith('NonExistentArtist');
    });

    test('should return null when searchArtists throws an error', async () => {
        spySearchArtists.mockRejectedValue(new Error('Network Error'));

        const result = await getArtistData('ErrorArtist');

        expect(result).toBeNull();
    });

    test('should return null when getArtist throws an error', async () => {
        // Setup search to succeed
        spySearchArtists.mockResolvedValue([{
            name: 'Test Artist',
            browseId: 'UC123',
            thumbnails: [{ url: 'http://example.com/thumb.jpg', width: 100, height: 100 }]
        }]);

        // Setup getArtist to fail
        spyGetArtist.mockRejectedValue(new Error('Detail Error'));

        const result = await getArtistData('Test Artist');

        expect(result).toBeNull();
        expect(spySearchArtists).toHaveBeenCalled();
        expect(spyGetArtist).toHaveBeenCalledWith('UC123');
    });

    test('should return structured data when all APIs succeed', async () => {
        // 1. Mock Search Result
        spySearchArtists.mockResolvedValue([{
            name: 'Happy Artist',
            browseId: 'UC_HAPPY',
            thumbnails: [{ url: 'https://lh3.googleusercontent.com/test-w100-h100.jpg', width: 100, height: 100 }]
        }]);

        // 2. Mock Artist Details
        spyGetArtist.mockResolvedValue({
            description: 'A very happy artist',
            subscribers: '1M',
            sections: [
                {
                    title: 'Songs',
                    results: [
                        { videoId: 'v1', title: 'Happy Song', album: { name: 'Happy Album' }, duration: '3:00', plays: '1000' }
                    ]
                },
                {
                    title: 'Albums',
                    results: [
                        { albumId: 'a1', title: 'Happy Album', year: '2023', browseId: 'b_a1' }
                    ]
                }
            ]
        });

        // 3. Mock Fetch (Bandsintown)
        global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify([
            {
                id: 'evt1',
                datetime: '2023-12-25T19:00:00',
                venue: { name: 'Happy Hall', city: 'Joy City', country: 'Funland' },
                url: 'http://event.com'
            }
        ]), { status: 200 })));

        const result = await getArtistData('Happy Artist');

        expect(result).not.toBeNull();
        expect(result!.id).toBe('UC_HAPPY');
        expect(result!.name).toBe('Happy Artist');
        expect(result!.topSongs).toHaveLength(1);
        expect(result!.topSongs[0].title).toBe('Happy Song');
    });
});
