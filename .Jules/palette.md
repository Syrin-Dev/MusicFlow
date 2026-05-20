## 2025-02-28 - Icon-Only Button ARIA Labels
**Learning:** Icon-only interactive buttons (like Play/Pause, Shuffle, Repeat in player bars) must have dynamic `aria-label` attributes that update with their state to be accessible to screen reader users, rather than relying solely on visual icons.
**Action:** When adding or modifying interactive UI components that only use icons for visual representation, explicitly include an `aria-label` that clearly describes the action the button will perform (and update it if the state changes, e.g., 'Pause' vs 'Play').
