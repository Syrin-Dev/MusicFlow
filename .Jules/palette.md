## 2024-05-26 - Stateful Toggle Button Accessibility
**Learning:** Interactive buttons relying solely on visual icons must utilize dynamically updating aria-label attributes. However, stateful toggle buttons (e.g., Like, Shuffle, Repeat) must also bind their active state using the `aria-pressed` attribute to accurately convey their current interaction states to screen reader users.
**Action:** When adding ARIA labels to icon-only toggle buttons, always include `aria-pressed={stateVar}` to announce whether the feature is currently active.
