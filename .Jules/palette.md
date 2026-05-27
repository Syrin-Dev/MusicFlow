## 2024-05-24 - Accessibility states on Player controls
**Learning:** Adding dynamic ARIA states (`aria-label`, `aria-pressed`, `aria-expanded`) to interactive toggle controls (like shuffle, repeat, play/pause, volume) makes audio players significantly more accessible for screen readers by conveying real-time state changes on buttons that use visual icons alone.
**Action:** Use conditional ARIA attributes (e.g. `aria-pressed={liked}`) alongside dynamic `aria-label`s when implementing toggleable UI controls relying purely on visual indicator changes.
