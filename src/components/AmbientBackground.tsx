'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '@/components/AudioProvider';
import ColorThief from 'colorthief';

// Global cache for extracted colors to prevent re-calculation on navigation
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

        // Prevent concurrent processing
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
            // Get a small palette to be fast
            const palette = colorThief.getPalette(img, 3);

            const hexColors = palette.map((rgb: number[]) =>
                `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`
            );

            // Ensure we have at least 2 colors, fallback to brand colors if extraction fails
            const finalColors = hexColors.length >= 2 ? hexColors : ['#8B5CF6', '#0d0d0f'];

            colorCache.set(trackId, finalColors);
            setColors(finalColors);
        } catch (error) {
            console.warn('Color extraction failed, using fallback', error);
             setColors(['#8B5CF6', '#0d0d0f']);
        } finally {
            processingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!currentTrack?.thumbnail) return;

        // Only run if track changed
        if (currentTrack.id === lastTrackIdRef.current) return;
        lastTrackIdRef.current = currentTrack.id;

        // Use requestIdleCallback to avoid blocking main thread during navigation/interaction
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                extractColors(currentTrack.thumbnail, currentTrack.id);
            });
        } else {
            // Fallback for Safari
            setTimeout(() => {
                extractColors(currentTrack.thumbnail, currentTrack.id);
            }, 100);
        }
    }, [currentTrack, extractColors]);

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

            {/* Global Overlay for depth/darkness - essential for text readability */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[100px]" />

            {/* Noise Texture for organic feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')] bg-repeat" />
        </div>
    );
}
