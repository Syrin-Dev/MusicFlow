## 2024-07-08 - Accessible Custom Seek Sliders
**Learning:** When making custom ARIA sliders (like the seek bar in the audio player) keyboard accessible using `tabIndex={0}` and Arrow keys, using `overflow-hidden` on the container will clip standard focus rings (`focus-visible:ring-2`).
**Action:** Remove `overflow-hidden` on the slider container to allow focus rings to show. Ensure child elements like the active progress track have bounding styles (`rounded-full`) if they need rounded corners so they do not visually leak. Provide `role="slider"`, `aria-label`, and `aria-value*` attributes.
