## 2024-05-23 - Interactive Card Pattern
**Learning:** Avoid nesting interactive elements (buttons) inside a container with `role="button"` or `<button>`. This breaks accessibility tree and keyboard navigation.
**Action:** When a card has a primary action (expand/navigate) and secondary actions (like/play), do not make the card a button. Instead, wrap the primary content (image/title) in a button and keep secondary actions as sibling buttons within a container div.
