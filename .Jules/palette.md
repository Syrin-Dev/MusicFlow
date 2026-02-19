## 2024-05-22 - Dynamic ARIA Labels
**Learning:** Dynamic ARIA labels are crucial for stateful controls (like Play/Pause, Mute/Unmute, Shuffle). Using static labels for toggles can confuse screen reader users about the current state or the action that will be performed.
**Action:** Always derive `aria-label` from the component's state variables (e.g., `isPlaying ? "Pause" : "Play"`) rather than the icon's visual appearance alone.
