## 2026-06-29 - Interactive buttons relying on visual icons
**Learning:** Interactive buttons relying solely on visual icons must utilize dynamically updating aria-label attributes. Stateful toggle buttons (e.g., Like, Shuffle, Repeat) must also bind their active state using the `aria-pressed` attribute to accurately convey their current interaction states to screen reader users.
**Action:** Adding aria attributes to playback controls in PlayerBar.
