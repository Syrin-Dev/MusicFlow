## 2024-03-05 - Missing ARIA labels in PlayerBar
**Learning:** The PlayerBar component (which is highly interactive and central to the app) contains multiple icon-only buttons (shuffle, previous, play/pause, next, repeat, volume) that completely lack `aria-label`s and `title`s. These are crucial for screen reader accessibility and general UX.
**Action:** Always verify that interactive audio controls have meaningful ARIA labels, especially when the icon changes based on state (like play/pause or repeat modes).
