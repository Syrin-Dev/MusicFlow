## 2024-05-24 - Custom Slider Accessibility Pattern
**Learning:** Custom div-based seek sliders across the application frequently lack necessary ARIA roles (slider), state attributes (aria-valuemin, max, now), and keyboard handlers (onKeyDown with Arrow keys) preventing accessibility for screen reader and keyboard users.
**Action:** Ensure any custom interactive slider elements include `role="slider"`, proper `aria-value*` properties, `tabIndex={0}`, standard focus ring styling, and Arrow key interaction support.
