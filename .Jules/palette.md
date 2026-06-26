## 2024-06-26 - Hide Native WebKit Search Cancel Button
**Learning:** When building a custom clear button for a search input, WebKit browsers will also render a native cancel button inside `<input type="search">`, resulting in duplicate 'X' buttons.
**Action:** Hide the default browser cancel button using CSS (e.g., `[&::-webkit-search-cancel-button]:hidden` in Tailwind) when a custom clear component is used.
