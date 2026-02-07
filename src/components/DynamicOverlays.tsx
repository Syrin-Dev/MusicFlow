'use client';

import dynamic from 'next/dynamic';

const ExpandedPlayer = dynamic(() => import('@/components/ExpandedPlayer').then(mod => mod.ExpandedPlayer), {
    ssr: false
});

const SocialOverlay = dynamic(() => import('@/components/SocialOverlay').then(mod => mod.SocialOverlay), {
    ssr: false
});

export function DynamicOverlays() {
    return (
        <>
            <ExpandedPlayer />
            <SocialOverlay />
        </>
    );
}
