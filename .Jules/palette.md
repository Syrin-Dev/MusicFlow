## 2024-06-12 - Accessible Custom Sliders
**Learning:** Custom UI sliders (like a seek bar built with `div`s) require manual handling of ARIA attributes (`role="slider"`, `aria-valuenow`, etc.) and keyboard events (`onKeyDown` for arrow keys) to be accessible, whereas native `<input type="range">` elements handle this automatically but still require accessible names (e.g., `aria-label`).
**Action:** When implementing or fixing custom interactive elements, always ensure they are fully navigable via keyboard and have appropriate screen-reader context using standard ARIA roles and labels.
