'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '@/components/AudioProvider';
import ColorThief from 'colorthief';

// Global cache for extracted colors
const colorCache = new Map<string, string[]>();

export function AmbientBackground() {
    const { currentTrack } = useAudio();
    const [colors, setColors] = useState<string[]>(['#18181b', '#000000']);

    // Use refs for debouncing and tracking
    const processingRef = useRef(false);
    const lastTrackIdRef = useRef<string | null>(null);

    const extractColors = useCallback(async (imgUrl: string, trackId: string) => {
        if (colorCache.has(trackId)) {
            setColors(colorCache.get(trackId)!);
            return;
        }

        // Prevent concurrent processing for the same track
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imgUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 3);

            // Convert RGB array to Hex strings
            const hexColors = palette.map((rgb: number[]) =>
                `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`
            );

            // Ensure we have at least 2 colors, fallback to dark/brand if too few
            const finalColors = hexColors.length >= 2 ? hexColors : ['#8B5CF6', '#0d0d0f'];

            colorCache.set(trackId, finalColors);
            setColors(finalColors);
        } catch (error) {
            console.warn('Color extraction failed, using fallback', error);
            const fallback = ['#8B5CF6', '#0d0d0f'];
            colorCache.set(trackId, fallback);
            setColors(fallback);
        } finally {
            processingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!currentTrack?.thumbnail) return;

        // Only run if track changed
        if (currentTrack.id === lastTrackIdRef.current) return;
        lastTrackIdRef.current = currentTrack.id;

        extractColors(currentTrack.thumbnail, currentTrack.id);
    }, [currentTrack, extractColors]);

    // Use CSS variables or inline styles with optimized properties
    return (
        <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none bg-[#0d0d0f]">
            {/* Mesh Gradient Layer 1 - Primary Color */}
            <div
                className="absolute inset-0 w-full h-full opacity-40 ambient-glow mix-blend-screen"
                style={{
                    background: `radial-gradient(circle at 20% 30%, ${colors[0]}80 0%, transparent 60%)`,
                    transition: 'background 2.0s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'background, transform'
                }}
            />

            {/* Mesh Gradient Layer 2 - Secondary Color */}
            <div
                className="absolute inset-0 w-full h-full opacity-30 ambient-glow mix-blend-screen"
                style={{
                    background: `radial-gradient(circle at 80% 70%, ${colors[1] || colors[0]}80 0%, transparent 60%)`,
                    transition: 'background 2.0s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                    willChange: 'background, transform'
                }}
            />

            {/* Global Overlay for depth/blur/darkness */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[100px]" />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/noise.png')" }} />
        </div>
    );
}
