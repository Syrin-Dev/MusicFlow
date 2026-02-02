/**
 * StreamFlow Main Controller
 * Connects Router, Player, Physics, and Search
 */

class App {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        // Global Search
        const searchInput = document.getElementById('global-search');
        let debounce;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length > 2) {
                    this.renderSearchResults(query);
                }
            }, 500);
        });

        // Flow State Trigger
        document.getElementById('flow-trigger').addEventListener('click', () => {
            window.physics.toggle();
        });

        // Volume Slider
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            window.player.setVolume(e.target.value);
        });

        // Full Player Toggle
        document.getElementById('mini-player-info').addEventListener('click', () => {
            document.getElementById('full-player-overlay').classList.remove('translate-y-full');
        });

        document.getElementById('close-full-player').addEventListener('click', () => {
            document.getElementById('full-player-overlay').classList.add('translate-y-full');
        });
    }

    async renderSearchResults(query) {
        // Switch to generic search route or just partial render
        // Let's manually inject into view for smoother UX
        const container = document.getElementById('main-view');
        container.innerHTML = `<div class="p-10 text-center"><div class="animate-spin w-8 h-8 border-2 border-violet-500 rounded-full border-t-transparent mx-auto"></div></div>`;

        const results = await window.api.search(query);

        container.innerHTML = `
            <section class="physics-element">
                <h2 class="text-2xl font-bold mb-6">Results for "${query}"</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    ${results.map(item => this.createCardHTML(item)).join('')}
                </div>
            </section>
        `;
    }

    createCardHTML(song) {
        // Store song data in data-attributes for easy access
        const data = encodeURIComponent(JSON.stringify(song));
        return `
            <div class="music-card physics-element group" onclick="app.playCard('${data}')">
                <div class="relative aspect-square m-3 rounded-2xl overflow-hidden">
                    <img src="${song.thumbnail}" class="w-full h-full object-cover">
                    <div class="play-btn">
                         <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
                <div class="p-4 pt-1">
                    <h3 class="font-bold text-white truncate">${song.title}</h3>
                    <p class="text-sm text-white/50 truncate">${song.artist}</p>
                </div>
            </div>
        `;
    }

    playCard(dataStr) {
        const song = JSON.parse(decodeURIComponent(dataStr));
        window.player.play(song.id);
        this.updatePlayerUI(song);
    }

    upatePlayerUI(song) {
        // Mini Player
        document.getElementById('player-title').innerText = song.title;
        document.getElementById('player-artist').innerText = song.artist;
        document.getElementById('player-thumb').src = song.thumbnail;

        // Full Player
        document.getElementById('fp-title').innerText = song.title;
        document.getElementById('fp-artist').innerText = song.artist;
        document.getElementById('fp-art').src = song.thumbnail;
        document.getElementById('overlay-bg').style.backgroundImage = `url(${song.thumbnail})`;

        // Save to Recents (Local Storage - Implementation Omitted for brevity but logic is here)
    }

    // Proxy for onclicks in HTML
    search(query) {
        document.getElementById('global-search').value = query;
        this.renderSearchResults(query);
    }
}

// Init
window.app = new App();
// Fix typo in method name export
window.app.updatePlayerUI = window.app.upatePlayerUI;
