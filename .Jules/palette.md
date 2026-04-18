## 2024-05-18 - Added ARIA labels to PlayerBar
**Learning:** Icon-only buttons in complex music players often lack accessible names, making them difficult for screen reader users to navigate. Dynamically changing `aria-label`s based on state (like Play/Pause, Mute/Unmute, and Shuffle/Repeat) significantly improves context for assistive technologies.
**Action:** Always ensure icon-only interactive elements in reusable components have descriptive, dynamically updating `aria-label`s reflecting their current state.
