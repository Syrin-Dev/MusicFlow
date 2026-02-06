'use client';

import { useAudio } from '@/components/AudioProvider';
import { extractColorsFromImage } from '@/lib/colors';
import { useEffect, useState } from 'react';

export function AmbientBackground() {
    const { currentTrack } = useAudio();
    const [colors, setColors] = useState<string[]>(['#1e1b4b', '#0d0d0f']);

    useEffect(() => {
        let isMounted = true;

        if (currentTrack?.thumbnail) {
             // Extract colors
             extractColorsFromImage(currentTrack.thumbnail).then(extracted => {
                 if (isMounted) {
                     setColors(extracted);
                 }
             });
        } else {
             // Revert to base theme
             setColors(['#1e1b4b', '#0d0d0f']);
        }

        return () => { isMounted = false; };
    }, [currentTrack?.thumbnail]);

    // Use the first two vibrant colors for the gradient
    const color1 = colors[0] || '#8B5CF6';
    const color2 = colors[1] || '#1e1b4b';

    return (
        <div
            className="fixed inset-0 w-full h-full -z-50 pointer-events-none overflow-hidden transition-colors duration-[1200ms] ease-in-out"
            style={{
                backgroundColor: '#0d0d0f' // Base background
            }}
        >
            {/* Mesh Gradient Layer 1 */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-40 mix-blend-screen transition-all duration-[1200ms] ease-in-out"
                style={{ backgroundColor: color1 }}
            />

            {/* Mesh Gradient Layer 2 */}
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-30 mix-blend-screen transition-all duration-[1200ms] ease-in-out"
                style={{ backgroundColor: color2 }}
            />

             {/* Mesh Gradient Layer 3 (Accent) */}
            <div
                className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full blur-[140px] opacity-20 mix-blend-screen transition-all duration-[1200ms] ease-in-out animate-pulse"
                style={{ backgroundColor: color1 }}
            />
        </div>
    );
}
