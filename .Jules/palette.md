
## 2024-04-09 - Added missing aria-labels to PlayerBar icon buttons
**Learning:** Icon-only buttons without text content need explicit `aria-label`s for screen reader support. For stateful buttons like "Play/Pause" or "Like/Unlike", dynamic `aria-label`s must be implemented (e.g., `aria-label={isPlaying ? "Pause" : "Play"}`) to reflect the current state to the user accurately.
**Action:** Always verify that icon-only buttons have dynamic or static `aria-label` attributes reflecting their active state or default action, particularly when they operate within persistent global UI elements like media players.
