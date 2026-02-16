## 2025-02-27 - Icon-only Button Accessibility
**Learning:** Icon-only buttons (like player controls) are frequently missing `aria-label`, making them inaccessible to screen readers. This is a recurring pattern in `PlayerBar` and `AddToPlaylist`.
**Action:** Always audit icon-only buttons for `aria-label` or `title` attributes during implementation. Use descriptive labels (e.g., 'Play'/'Pause' instead of just 'Toggle').
