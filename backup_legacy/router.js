/**
 * StreamFlow SPA Router
 * Handles navigation without page reloads
 */

class Router {
    constructor(routes) {
        this.routes = routes;
        this.viewContainer = document.getElementById('main-view');

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Init
    }

    navigate(path) {
        window.location.hash = path;
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.routes[hash] || this.routes['/'];

        // Update Active Nav State
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('href') === `#${hash}`);
        });

        // Clear View
        this.viewContainer.innerHTML = ''; // Loading state could go here

        // Render View
        if (route) {
            this.viewContainer.innerHTML = await route.render();
            if (route.afterRender) route.afterRender();
        }
    }
}

window.router = new Router({
    '/': {
        render: async () => {
            const charts = await window.api.getTopCharts();
            return `
                <section class="physics-element mb-12">
                    <h1 class="text-4xl font-bold mb-6 flex items-center gap-3">
                        <span class="text-gradient">Flow State</span> 
                        <span class="text-2xl text-white/50 font-normal">Mixes</span>
                    </h1>
                    
                    <!-- Featured Hero -->
                    <div class="relative h-96 rounded-[32px] overflow-hidden group cursor-pointer border border-white/5" onclick="player.play('${charts[0].id}')">
                        <img src="${charts[0].thumbnail}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/40 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 p-10">
                            <span class="px-3 py-1 bg-violet-500 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Featured Track</span>
                            <h2 class="text-5xl font-black mb-2">${charts[0].title}</h2>
                            <p class="text-xl text-white/70">${charts[0].artist}</p>
                        </div>
                        <div class="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full flex items-center justify-center text-charcoal transition-transform duration-300 hover:scale-110 shadow-xl shadow-white/10">
                            <svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </section>

                <section class="physics-element">
                    <h2 class="text-2xl font-bold mb-6">Top Global Hits</h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        ${charts.map(song => window.app.createCardHTML(song)).join('')}
                    </div>
                </section>
            `;
        }
    },
    '/explore': {
        render: async () => `
            <div class="physics-element text-center py-20">
                <h2 class="text-3xl font-bold mb-4">Explore Genres</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                     ${['Pop', 'Lo-Fi', 'Electronic', 'Rock', 'Hip-Hop', 'Ambient', 'Jazz', 'Classical'].map(g => `
                        <div class="h-32 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-violet-500 hover:border-violet-400 transition-colors cursor-pointer text-xl font-bold" onclick="app.search('${g}')">
                            ${g}
                        </div>
                     `).join('')}
                </div>
            </div>
        `
    },
    '/library': {
        render: async () => {
            const likes = JSON.parse(localStorage.getItem('streamflow_likes') || '[]');
            if (likes.length === 0) return `<div class="text-center py-20 text-white/50">Your library is empty. Go like some songs!</div>`;

            // In a real app we'd fetch details for these IDs if not stored fully
            // Here we assume basic details are stored or mocked
            return `
                <section class="physics-element">
                    <h2 class="text-2xl font-bold mb-6">Liked Songs</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        ${likes.map(id => window.app.createCardHTML({ id, title: 'Liked Track', artist: 'Unknown', thumbnail: 'https://via.placeholder.com/300' })).join('')}
                    </div>
                </section>
             `;
        }
    }
});
