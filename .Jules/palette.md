## 2026-03-19 - Custom Slider Accessibility
**Learning:** Custom UI sliders (like progress bars or volume controls) built as interactive `div`s lack inherent semantics and keyboard support, making them completely inaccessible to screen readers and keyboard users.
**Action:** Always implement custom sliders with `role="slider"`, `tabIndex={0}`, standard state properties (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-label`), visible focus styles, and `onKeyDown` handlers (ArrowRight/ArrowLeft) to ensure full accessibility.
