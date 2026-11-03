# Drawer

**Purpose:** a modal panel: side drawer on wide screens, bottom sheet on narrow ones. Used by `App` to show `<Plan variant="drawer" />` over Results.
**Behaviour:** `role="dialog"`, `aria-modal`, labelled by its title. Esc, the Close button and the backdrop call `onClose`. Tab and Shift+Tab wrap inside. Focus moves to the first control on open and back to the opener on close. `body` scroll is locked while open. Render it only while open; the caller makes the page behind it `inert`.
**Rules:** no trip state here; `onClose` should be a stable function. Animations use the `--duration` token (0 under reduced motion).
**Tests:** `Drawer.test.tsx`, plus `__tests__/editDrawer.test.tsx` for the App flow.
