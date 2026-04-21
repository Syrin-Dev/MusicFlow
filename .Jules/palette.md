## 2024-04-21 - Icon-only buttons lacking ARIA labels
**Learning:** Icon-only buttons in PlayerBar.tsx lack ARIA labels which makes them inaccessible to screen readers.
**Action:** Always add aria-label attributes to buttons that only contain icons, specifically dynamically setting the label based on the state for toggles (e.g. Play/Pause).
