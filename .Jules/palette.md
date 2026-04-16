## 2026-04-16 - Accessible Icon Buttons in Player
**Learning:** Found that almost none of the icon buttons across core playback components (PlayerBar, ExpandedPlayer) have `aria-label` attributes, making the main interactive surface of the app completely opaque to screen readers.
**Action:** Always add dynamic or static `aria-label` attributes to icon-only buttons, especially for media controls where state changes (e.g., play/pause, volume, mute).
