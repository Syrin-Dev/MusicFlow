## 2026-03-21 - Custom Search Clear Button
**Learning:** When using custom clear buttons alongside an `<input type="search">`, Webkit browsers render an additional, duplicate default 'X' cancel button. This causes visual duplication and screen reader confusion.
**Action:** Always append the Tailwind utility `[&::-webkit-search-cancel-button]:hidden` to search inputs when a custom clear button is implemented to hide the browser's default cancel button.
