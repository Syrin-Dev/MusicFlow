'use client';

import { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/components/AudioProvider';
import ColorThief from 'colorthief';

// Helper to check saturation
function getSaturation(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (max === 0) return 0;
    return d / max;
}

const DEFAULT_COLOR = [139, 92, 246]; // #8B5CF6 (Vivid Purple)

// Global cache for extracted colors to avoid re-processing
const colorCache = new Map<string, number[][]>();

export function AmbientBackground() {
    const { currentTrack } = useAudio();
    const [colors, setColors] = useState<number[][]>([DEFAULT_COLOR, DEFAULT_COLOR]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colorThiefRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !colorThiefRef.current) {
            colorThiefRef.current = new ColorThief();
        }
    }, []);

    useEffect(() => {
        if (!currentTrack?.thumbnail || !colorThiefRef.current) return;

        // Check cache first
        if (colorCache.has(currentTrack.thumbnail)) {
            setColors(colorCache.get(currentTrack.thumbnail)!);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        // Use a proxy or ensure the image allows CORS. YouTube usually does.
        // Adding a timestamp to bypass cache if needed, but usually not needed for YT.
        img.src = currentTrack.thumbnail;

        img.onload = () => {
            try {
                // Get palette of 5 colors to have variety
                const palette = colorThiefRef.current.getPalette(img, 5);

                if (palette && palette.length > 0) {
                    // Check saturation of the dominant color
                    const [r, g, b] = palette[0];
                    const saturation = getSaturation(r, g, b);

                    let newColors = [DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR];

                    // The 'Saturation Floor' Rule
                    // If saturation is too low (grayscale/muddy), force Vivid Purple
                    if (saturation < 0.25) { // Adjusted threshold for better feel
                        newColors = [DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR];
                    } else {
                        // Pick 2-3 vibrant colors.
                        // Sometimes the first one is dark/black, so we might want to skip it if it's too dark.
                        // But let's trust ColorThief's ranking for now, or filter for brightness.
                        newColors = palette.slice(0, 3);
                    }

                    // Update cache and state
                    colorCache.set(currentTrack.thumbnail, newColors);
                    setColors(newColors);
                }
            } catch (e) {
                console.warn('Color extraction failed, using default.', e);
                setColors([DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR]);
            }
        };

        img.onerror = () => {
             // Fallback
             setColors([DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR]);
        };

    }, [currentTrack?.thumbnail]);

    const color1 = `rgb(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]})`;
    const color2 = colors[1] ? `rgb(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]})` : color1;
    const color3 = colors[2] ? `rgb(${colors[2][0]}, ${colors[2][1]}, ${colors[2][2]})` : color2;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none bg-[#0d0d0f] transition-colors duration-[1200ms]">
            {/* Mesh Gradients - The "Ambient Light" */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-screen opacity-30 blur-[100px] transition-colors duration-[1200ms] ease-in-out animate-pulse-slow"
                style={{ backgroundColor: color1 }}
            />
             <div
                className="absolute top-[10%] right-[-20%] w-[60%] h-[60%] rounded-full mix-blend-screen opacity-25 blur-[120px] transition-colors duration-[1200ms] ease-in-out"
                style={{ backgroundColor: color2 }}
            />
             <div
                className="absolute bottom-[-10%] left-[30%] w-[50%] h-[60%] rounded-full mix-blend-screen opacity-20 blur-[140px] transition-colors duration-[1200ms] ease-in-out"
                style={{ backgroundColor: color3 }}
            />

            {/* Glass/Noise Overlay if desired, but sticking to clean mesh for now.
                Adding a slight dark overlay to ensure text contrast is always maintained. */}
             <div className="absolute inset-0 bg-black/40" />
        </div>
    );
}
