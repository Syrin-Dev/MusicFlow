## 2024-05-18 - Header Accessibility Insights
**Learning:** Found that icon-only buttons like the Friend Activity and Profile Dropdown toggles in `Header.tsx` were missing `aria-label` attributes, which breaks accessibility for screen readers.
**Action:** Ensure that all newly created icon-only buttons include an `aria-label` describing their action or target.
