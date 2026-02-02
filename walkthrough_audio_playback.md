# Audio Playback Flow Walkthrough

This document outlines the technical flow of audio playback in the StreamFlow application, detailing how user interactions translate to audio output via the YouTube IFrame API.

## 1. User Interaction
- **Trigger**: User clicks the "Play" button on a track card in the `RecommendationGrid` or the "Play Now" button in the `Hero`.
- **Action**: The `onClick` handler calls `playTrack(track)` from the `AudioContext`.

## 2. State Management (AudioProvider)
- **Context Update**: `AudioProvider` receives the `playTrack` call.
- **State**: `currentTrack` is updated with the new track metadata (ID, Title, Artist, Thumbnail).
- **Loading**: `isLoading` is set to `true`.

## 3. YouTube IFrame API Integration
- **Ref Access**: The provider accesses the hidden `YT.Player` instance via `playerRef`.
- **Command**: `playerRef.current.loadVideoById(track.id)` is called.
- **Audio Output**: The generic YouTube video player (hidden) begins streaming the audio content.

## 4. Playback Synchronization
- **Event Listeners**: The `onStateChange` event from the API detects the change to `PLAYING` state.
- **UI Update**: 
    - `isPlaying` state is set to `true`.
    - `PlayerBar` component re-renders to show the "Pause" icon.
    - `PlayerBar` metadata updates to show the new song title/artist.

## 5. Persistent Control
- The `PlayerBar` remains mounted across page navigation (`layout.tsx`), ensuring uninterrupted playback while the user explores the "Library" or "Explore" pages.
