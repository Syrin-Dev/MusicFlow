## 2025-05-18 - [Accessibility in Custom Controls]
**Learning:** Custom interactive elements (like `div` progress bars) often lack keyboard accessibility and screen reader support, making them unusable for many users.
**Action:** Always add `role="slider"`, `tabIndex={0}`, `aria` attributes, and `onKeyDown` handlers to custom sliders to ensure they are accessible. Also ensure all icon-only buttons have descriptive `aria-label` attributes.
