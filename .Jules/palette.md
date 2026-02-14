## 2024-05-22 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (e.g., in `PlayerBar.tsx`) consistently lacked both `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing for mouse users who rely on tooltips.
**Action:** When creating or modifying icon-only buttons, always enforce the addition of both `aria-label` (for assistive technology) and `title` (for visual tooltips) to ensure inclusive usability.
