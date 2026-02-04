'use client';

import { useAudio } from '@/components/AudioProvider';
import MusicFlowConnect from '@/components/MusicFlowConnect';

export function SocialOverlay() {
    const { isConnectOpen, closeConnect, connectInitialTrack } = useAudio();

    return (
        <MusicFlowConnect
            isOpen={isConnectOpen}
            onClose={closeConnect}
            initialTrack={connectInitialTrack}
        />
    );
}
