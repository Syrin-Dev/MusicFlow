## 2024-05-14 - PlayerBar Accessibility Fixes
**Learning:** Found custom div-based progress bars missing necessary ARIA attributes for slider functionality. Icon-only buttons for playback controls lacked `aria-label`s, rendering them ambiguous to screen readers.
**Action:** Adding explicit slider ARIA properties (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`) and keyboard handlers to custom seek bars. Ensuring dynamic `aria-label`s on icon buttons based on state (e.g., Play/Pause).
