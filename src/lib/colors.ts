export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
    if (typeof window === 'undefined') return ['#0d0d0f', '#0d0d0f'];

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(['#8B5CF6', '#0d0d0f']);
                return;
            }

            canvas.width = 50; // Low res for speed and better averaging
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            const colorCounts: { [key: string]: number } = {};

            // Simple quantization and counting
            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                // Ignore very dark or very light pixels
                if ((r < 20 && g < 20 && b < 20) || (r > 240 && g > 240 && b > 240)) continue;

                // Quantize to reduce noise
                const qr = Math.round(r / 20) * 20;
                const qg = Math.round(g / 20) * 20;
                const qb = Math.round(b / 20) * 20;

                const key = `${qr},${qg},${qb}`;
                colorCounts[key] = (colorCounts[key] || 0) + 1;
            }

            const sortedColors = Object.entries(colorCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([key]) => key.split(',').map(Number));

            const vibrantColors: string[] = [];

            for (const [r, g, b] of sortedColors) {
                if (isVibrant(r, g, b)) {
                    vibrantColors.push(`rgb(${r},${g},${b})`);
                }
                if (vibrantColors.length >= 3) break;
            }

            // Saturation Floor Rule
            if (vibrantColors.length === 0) {
                 resolve(['#8B5CF6', '#1e1b4b']); // Signature Purple + Deep Dark Blue/Purple
            } else if (vibrantColors.length === 1) {
                 resolve([vibrantColors[0], '#1e1b4b']);
            } else {
                 resolve(vibrantColors);
            }
        };

        img.onerror = () => {
            resolve(['#8B5CF6', '#0d0d0f']);
        };
    });
}

function isVibrant(r: number, g: number, b: number): boolean {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const saturation = max === 0 ? 0 : diff / max;

    // Check brightness to avoid too dark colors
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Require some saturation and brightness
    return saturation > 0.2 && brightness > 40;
}
