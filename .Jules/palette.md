## 2026-03-20 - Keyboard Accessibility with Hover Utilities
**Learning:** Using `opacity-0 group-hover/item:opacity-100` hides interactive elements (like delete buttons inside list items) from keyboard navigation. They are functionally focusable but remain invisible when tabbed to, causing confusion.
**Action:** Always pair such hover opacity utilities with `focus-visible:opacity-100` along with explicit focus ring classes (`focus-visible:ring-2`) to ensure the element reveals itself when receiving keyboard focus.
