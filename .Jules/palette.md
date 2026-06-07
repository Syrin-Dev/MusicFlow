## 2024-06-07 - Stateful Toggle Accessibility
**Learning:** Added `aria-pressed` along with `aria-label` to icon-only stateful toggle buttons like Shuffle, Like, Play, and Repeat. Screen readers effectively read these attributes to understand the current state, and visual styling like `focus-visible` must be present for full keyboard navigation.
**Action:** When creating custom toggle buttons, ensure both `aria-label` and `aria-pressed` (or equivalent states) are implemented for robust screen reader support, alongside keyboard focus indicators.
