/**
 * StreamFlow Player Module
 * Wraps YouTube Iframe API
 */

class Player {
    constructor() {
        this.player = null;
        this.queue = [];
        this.currentIdx = 0;
        this.isPlaying = false;

        // Init YouTube API
        window.onYouTubeIframeAPIReady = () => {
            this.player = new YT.Player('youtube-player', {
                events: {
                    'onReady': this.onPlayerReady.bind(this),
                    'onStateChange': this.onStateChange.bind(this)
                },
                playerVars: { controls: 0, showinfo: 0, rel: 0, autoplay: 1 }
            });
        };

        // Inject script if missing
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
        }
    }

    onPlayerReady() {
        console.log('Player Ready');
        this.setVolume(50);
    }

    onStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startTicker();
            this.updateIcons(true);
        } else {
            this.isPlaying = false;
            this.stopTicker();
            this.updateIcons(false);
        }

        if (event.data === YT.PlayerState.ENDED) {
            this.next();
        }
    }

    load(videoId) {
        if (this.player && this.player.loadVideoById) {
            this.player.loadVideoById(videoId);
        }
    }

    play(videoId = null) {
        if (videoId) {
            // New Song
            this.load(videoId);
            // Fetch Details Mock (In real app, we'd pass the whole object)
            // For now, we update UI via App
            window.app.updatePlayerUI({ id: videoId });
        } else {
            // Resume
            this.player?.playVideo();
        }
    }

    pause() {
        this.player?.pauseVideo();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    next() {
        // Simple queue simulation
        // In full app, manage queue array
        // Here we just restart for demo or fetch random
        console.log('Next track...');
    }

    prev() {
        this.player?.seekTo(0);
    }

    setVolume(vol) {
        this.player?.setVolume(vol);
    }

    seek(percent) {
        const dur = this.player?.getDuration();
        if (dur) {
            this.player.seekTo(dur * percent);
        }
    }

    // UI Updates
    updateIcons(isPlaying) {
        // Toggle Play/Pause SVGs
        // Simplified: App.js handles this via events usually, but direct DOM here for speed
    }

    startTicker() {
        this.timer = setInterval(() => {
            if (!this.player || !this.player.getCurrentTime) return;
            const cur = this.player.getCurrentTime();
            const dur = this.player.getDuration();
            const percent = (cur / dur) * 100;

            const bar = document.getElementById('progress-fill');
            if (bar) bar.style.width = `${percent}%`;
        }, 500);
    }

    stopTicker() {
        clearInterval(this.timer);
    }
}

window.player = new Player();
