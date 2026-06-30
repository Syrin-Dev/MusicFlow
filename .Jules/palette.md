## 2026-06-30 - Material Icon Ligature Accessibility
**Learning:** Icon fonts with ligatures (like material-icons) are read literally by screen readers if not hidden (e.g., reading "skip_next" instead of "Next track").
**Action:** Always wrap ligature text in `<span aria-hidden="true">`, and provide a descriptive `aria-label` on the parent interactive element.
