## 2025-02-18 - Keyboard Accessibility for Custom Sliders
**Learning:** Custom `div`-based range sliders (like progress bars) are invisible to keyboard users unless explicitly given `tabIndex={0}`, `role="slider"`, and `onKeyDown` handlers.
**Action:** When styling a custom progress bar, always implement `ArrowLeft`/`ArrowRight` handling and proper ARIA roles (`valuemin`, `valuemax`, `valuenow`) to match native `<input type="range">` behavior.
