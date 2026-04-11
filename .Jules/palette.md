
## 2024-05-18 - Seek Bar Keyboard Accessibility Pattern
**Learning:** Custom progress/seek bars using `div` elements require full keyboard and screen reader support to be usable. Simply binding an `onClick` for mouse seeking excludes keyboard users.
**Action:** When building a custom interactive slider using `div` elements, apply the `role="slider"` attribute, `tabIndex={0}`, standard ARIA value mappings (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`), `focus-visible` ring styling to indicate focus, and implement an `onKeyDown` handler to map standard keys (e.g. `ArrowRight` to seek forward, `ArrowLeft` to seek back) to the seek logic. Ensure visually hidden interactive states (like a slider handle visible only on hover) are shown on `:focus-visible`.
