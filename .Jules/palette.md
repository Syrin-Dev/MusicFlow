## 2024-06-21 - Custom UI and `<input type="search">` in WebKit
**Learning:** When using `<input type="search">` to get the correct mobile keyboard behavior, WebKit browsers automatically add a native cancel/clear 'X' button. If a custom clear button is implemented alongside it, this creates a confusing UX with duplicate 'X' buttons.
**Action:** Always use CSS pseudo-selectors like `[&::-webkit-search-cancel-button]:hidden` (in Tailwind) to hide the browser's native cancel button when providing a custom, accessible clear button.
