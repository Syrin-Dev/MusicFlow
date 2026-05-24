## 2026-05-24 - Accessibility for Stateful Icon Buttons
**Learning:** Stateful media toggle buttons (Like, Shuffle, Repeat, Play/Pause, Mute) built with purely visual icons must use both `aria-label` to describe the action and `aria-pressed` bound to their current state boolean to convey current activation status to screen readers.
**Action:** Always include both `aria-label` (often dynamic based on state) and `aria-pressed={stateVar}` when creating toggleable icon-only buttons.
