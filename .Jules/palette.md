## 2026-05-30 - Avoiding Duplicate Search Cancel Buttons
**Learning:** When changing a text input to `type="search"` while maintaining a custom clear button ('X' icon) to improve semantics, WebKit browsers will automatically render their own native cancel button, leading to two clear buttons appearing simultaneously.
**Action:** Use CSS or Tailwind utility `[&::-webkit-search-cancel-button]:hidden` on the input element to suppress the browser's default cancel button while preserving the custom implementation.
