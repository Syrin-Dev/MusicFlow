## 2024-05-18 - Added ARIA labels to PlayerBar
**Learning:** Found that many interactive icon-only buttons in critical music player interfaces (like PlayerBar) lacked basic accessibility semantics. While visual design is clean, screen readers were missing essential context for core playback controls.
**Action:** Always verify icon-only buttons contain `aria-label`s, especially those that toggle state (e.g., Play/Pause, Shuffle, Repeat).
