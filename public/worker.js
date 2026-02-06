
// Heartbeat Worker
// Sends a 'tick' message every second to keep the main thread logic alive
// and check for background playback consistency.

let interval = null;

self.onmessage = function(e) {
    if (e.data === 'start') {
        if (!interval) {
            interval = setInterval(() => {
                self.postMessage('tick');
            }, 1000);
        }
    } else if (e.data === 'stop') {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }
};
