## 2024-05-19 - Accessible Icon Buttons with Ligature Fonts

**Learning:** When using ligature fonts (like Material Icons) where the text content of the element creates the icon, screen readers will mistakenly read out the literal ligature text (e.g., "favorite", "skip_next") if not explicitly hidden.

**Action:** Wrap ligature text in a `<span aria-hidden="true">` element, and add a descriptive `aria-label` and `aria-pressed` (for toggles) directly to the parent `<button>`. Finally, to support keyboard users, interactive icon buttons must have focus outlines (e.g., `focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none`).
