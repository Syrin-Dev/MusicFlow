## 2025-02-14 - Inline Action Loading States
**Learning:** Adding loading states (like a spinner and disabling the button) to inline async actions, such as "Accept" or "Decline" in a notification dropdown, prevents double-clicks during slow network requests and improves the user experience significantly without taking up extra space.
**Action:** When creating inline buttons for async actions (especially destructive ones or ones that trigger API calls), always include a disabled loading state and spinner, using `processingId` or similar state to target specific items.
