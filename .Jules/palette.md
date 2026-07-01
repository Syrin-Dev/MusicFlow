## 2024-05-18 - Accessible Search Components
**Learning:** Search components require specific HTML structure (`role="search"`, `type="search"`, and a visually hidden `<label>`) to be properly identified and navigable by screen readers, which is easily overlooked when building custom styled inputs.
**Action:** Always ensure search inputs have an associated hidden label, use `type="search"`, and wrap the input in a `<form role="search">`. Additionally, ensure interactive elements like clear buttons have explicit `aria-label`s and visible focus states.
