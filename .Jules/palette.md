## 2026-03-25 - Custom Slider Accessibility
**Learning:** Custom progress/seek bars implemented as `div`s in audio players fail silently for screen readers and keyboard users without proper setup.
**Action:** Always enforce `role="slider"`, `tabIndex={0}`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-label`, focus styles, and right/left `Arrow` key bindings to create accessible and navigable custom sliders.
