
## 2024-05-18 - [SearchBar Accessibility]
**Learning:** This app frequently relies on visual context for search functionality (e.g., using `type="search"` but relying on placeholder text and adjacent search icons instead of a linked label), missing out on semantic structures. Screen readers may misinterpret these inputs without explicitly linked labels.
**Action:** When working on inputs without visible labels, always use `<label className="sr-only" htmlFor="input-id">` coupled with `id="input-id"` on the input, ensuring semantic correctness and screen reader support without breaking the visual design. Apply explicit `role="search"` to form wrappers to support landmark navigation.
