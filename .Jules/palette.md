## 2024-05-18 - [Accessibility: Custom Clear Button for Search Input]
**Learning:** When using `<input type="search">` in Webkit environments alongside a custom clear button component, you should hide the browser's default cancel button using CSS (e.g., `[&::-webkit-search-cancel-button]:hidden` in Tailwind) to prevent duplicate 'X' clear options.
**Action:** Always include styles to hide native browser search cancel buttons when implementing a custom "clear search" functionality to avoid confusing duplicate UI elements.
