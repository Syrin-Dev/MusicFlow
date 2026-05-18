## 2024-05-18 - Dynamic ARIA Labels on Toggle Buttons
**Learning:** Icon-only toggle buttons (like Play/Pause, Like/Unlike, Shuffle, Repeat) require dynamically updating `aria-label` attributes that reflect the *action* that will occur when clicked (e.g., `aria-label={isPlaying ? "Pause" : "Play"}`), rather than static labels, to provide accurate state information to screen reader users.
**Action:** When adding accessibility to interactive components, always check if the button toggles state and implement dynamic ternary-based `aria-label` properties accordingly.
