/**
 * StreamFlow - Core Player Engine
 * Handles YouTube IFrame API, Playback State, and Queue Management
 */

class YouTubePlayer {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.isPlaying = false;
        this.currentVideo = null;

        // Queue System
        this.queue = [];
        this.originalQueue = []; // For un-shuffle
        this.history = [];
        this.currentIndex = -1;

        // Settings
        this.volume = 100;
        this.isMuted = false;
        this.shuffle = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'

        this.init();
    }

    init() {
        window.onYouTubeIframeAPIReady = () => this.createPlayer();
        if (window.YT && window.YT.Player) {
            this.createPlayer();
        } else {
            // Load API if not present
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }

    createPlayer() {
        this.player = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                origin: window.location.origin
            },
            events: {
                onReady: () => this.onPlayerReady(),
                onStateChange: (e) => this.onStateChange(e),
                onError: (e) => this.onError(e)
            }
        });
    }

    onPlayerReady() {
        this.isReady = true;
        this.player.setVolume(this.volume);
        window.dispatchEvent(new CustomEvent('player:ready'));
        console.log('StreamFlow Engine Ready');
    }

    onStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startProgressTracker();
        } else {
            this.isPlaying = false;
            this.stopProgressTracker();
        }

        if (event.data === YT.PlayerState.ENDED) {
            this.handleTrackEnd();
        }

        window.dispatchEvent(new CustomEvent('player:state', {
            detail: { isPlaying: this.isPlaying, state: event.data }
        }));
    }

    onError(e) {
        console.error('Player Error:', e.data);
        // Skip track on error
        setTimeout(() => this.next(), 1000);
    }

    // Playback Controls
    async play(video, contextQueue = []) {
        if (!this.isReady) return;

        // Update Queue if new context provided
        if (contextQueue.length > 0) {
            this.setQueue(contextQueue);
            // Find index of playing video
            this.currentIndex = this.queue.findIndex(v => v.id === video.id);
        } else if (this.currentIndex === -1) {
            // Playing single video without context, add to queue
            this.addToQueue(video);
            this.currentIndex = this.queue.length - 1;
        }

        this.currentVideo = video;
        this.player.loadVideoById(video.id);

        this.updateMediaSession(video);
        window.dispatchEvent(new CustomEvent('player:song-change', { detail: video }));
    }

    togglePlay() {
        if (!this.isReady) return;
        if (this.isPlaying) this.player.pauseVideo();
        else this.player.playVideo();
    }

    next() {
        if (this.queue.length === 0) return;

        let nextIndex = this.currentIndex + 1;

        if (nextIndex >= this.queue.length) {
            if (this.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                return; // End of playlist
            }
        }

        this.currentIndex = nextIndex;
        this.play(this.queue[this.currentIndex]);
    }

    prev() {
        if (this.player.getCurrentTime() > 3) {
            this.player.seekTo(0);
            return;
        }

        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.play(this.queue[this.currentIndex]);
        }
    }

    seekTo(seconds) {
        if (this.isReady) this.player.seekTo(seconds, true);
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.isReady) this.player.setVolume(vol);
        this.isMuted = vol === 0;
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            this.player.seekTo(0);
            this.player.playVideo();
        } else {
            this.next();
        }
    }

    // Queue Management
    setQueue(videos) {
        this.originalQueue = [...videos];
        if (this.shuffle) {
            this.queue = this.shuffleArray([...videos]);
        } else {
            this.queue = [...videos];
        }
        this.updateQueueUI();
    }

    addToQueue(video) {
        this.originalQueue.push(video);
        this.queue.push(video);
        this.updateQueueUI();
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;

        if (this.shuffle) {
            // Shuffle but keep current song first
            const current = this.queue[this.currentIndex];
            const others = this.queue.filter((_, i) => i !== this.currentIndex);
            this.queue = [current, ...this.shuffleArray(others)];
            this.currentIndex = 0;
        } else {
            // Restore original order
            const current = this.queue[this.currentIndex];
            this.queue = [...this.originalQueue];
            this.currentIndex = this.queue.findIndex(v => v.id === current.id);
        }

        window.dispatchEvent(new CustomEvent('player:shuffle', { detail: this.shuffle }));
        this.updateQueueUI();
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIdx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIdx + 1) % modes.length];

        window.dispatchEvent(new CustomEvent('player:repeat', { detail: this.repeatMode }));
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    updateQueueUI() {
        window.dispatchEvent(new CustomEvent('player:queue-update', {
            detail: {
                queue: this.queue,
                currentIndex: this.currentIndex
            }
        }));
    }

    // Helpers
    startProgressTracker() {
        this.stopProgressTracker();
        this.progressInterval = setInterval(() => {
            const current = this.player.getCurrentTime();
            const total = this.player.getDuration();
            window.dispatchEvent(new CustomEvent('player:progress', {
                detail: { current, total }
            }));
        }, 500);
    }

    stopProgressTracker() {
        clearInterval(this.progressInterval);
    }

    updateMediaSession(video) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: video.title,
                artist: video.artist,
                artwork: [{ src: video.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
            });

            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        }
    }

    // Search Mock (Reusing existing logic but improving structure)
    async search(query) {
        // Mock Data with specific categories
        const songs = [
            { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', album: 'Whenever You Need Somebody' },
            { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
            { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind' },
            { id: '2Vv-BfVoq4g', title: 'Perfect', artist: 'Ed Sheeran', album: 'Divide' },
            { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide' },
            { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', album: 'Vida' },
            { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Bruno Mars', album: 'Uptown Special' },
            { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', album: '25' },
            { id: '60ItHLz5WEA', title: 'On The Floor', artist: 'Jennifer Lopez', album: 'Love?' },
            { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', album: 'Prism' },
            { id: 'NotAFrealID', title: 'Sunset Stereo Mix', artist: 'StreamFlow', album: 'Originals' },
            { id: 'fakeID1', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming' },
            { id: 'fakeID2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy' }
        ].map(s => ({ ...s, thumbnail: `https://img.youtube.com/vi/${s.id}/mqdefault.jpg` }));

        const q = query.toLowerCase();
        const filtered = songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));

        return {
            topResult: filtered[0] || null,
            songs: filtered,
            videos: filtered.slice(0, 3) // Mock video results
        };
    }
}

window.youtubePlayer = new YouTubePlayer();
