## 2024-06-13 - Custom Slider Focus Clipping
**Learning:** When applying focus rings (e.g., focus-visible:ring-2) to custom UI elements like sliders in Tailwind, placing overflow-hidden on the outer container will clip the focus indicator. Also, native semantic input sliders aren't always used, requiring manual aria roles, tabIndex, and keyboard handlers.
**Action:** Move overflow-hidden to an inner track container so the outer focusable wrapper can display the ring properly. Implement role="slider", tabIndex={0}, and onKeyDown handlers for ArrowLeft/Right.
