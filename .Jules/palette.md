## 2024-05-23 - Semantic HTML for Custom Controls
**Learning:** The PlayerBar component (and likely others) used interactive `div` elements for controls like the track title and album art overlay, missing critical keyboard accessibility features (focus, activation via Enter/Space).
**Action:** Convert these custom interactive elements to semantic `<button>` tags to gain native keyboard support and accessibility semantics by default, ensuring `aria-label` is always present for icon-only variants.
