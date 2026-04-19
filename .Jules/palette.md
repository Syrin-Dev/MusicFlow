## 2024-05-24 - Interactive Seek Bar Accessibility
**Learning:** Custom seek and progress bars implemented as generic `<div>` elements natively lack semantic meaning, keyboard navigability, and screen reader feedback in this app's component patterns.
**Action:** Always map custom progress divs with `role="slider"`, `tabIndex={0}`, standard ARIA slider attributes (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`), keyboard event handlers (like `onKeyDown` for arrow keys), and `focus-visible` styling to ensure parity with native `<input type="range">`.
