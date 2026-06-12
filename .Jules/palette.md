## 2024-06-12 - Custom Slider Keyboard Accessibility & Clipping
**Learning:** When making custom sliders (like seek bars) keyboard accessible, the focus indicator and inner elements (like the slider thumb) can be clipped and invisible if the slider container uses `overflow-hidden`.
**Action:** Remove `overflow-hidden` from the container, add the standard focus ring utility (`focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none`), and ensure keyboard interactivity via `onKeyDown` with `role="slider"`, `tabIndex={0}`, and `aria-value*` attributes.
