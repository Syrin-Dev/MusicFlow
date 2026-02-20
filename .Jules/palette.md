# Palette's Journal

## 2025-02-27 - Semantic Loading States
**Learning:** When adding a visual loading spinner to a search input, it's crucial to also pair it with `aria-busy="true"` on the input element. This provides immediate semantic feedback to screen readers that the content (or related results) is currently being updated, which is often missed when only visual indicators are used.
**Action:** Always audit dynamic inputs and search bars for `aria-busy` state implementation during async operations in future components.
