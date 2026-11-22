# Accessibility (WCAG 2.1 AA)

- **Colour is never the only signal.** Every AQI band shows its text label (Good to Severe, in English or Hindi). Badge colours are paired with text colours of at least 4.5:1 contrast.
- **Charts have text alternatives.** The forecast SVG has a title, a description of every 6th hour, and a full data table.
- **Keyboard:** skip link, visible focus ring, native buttons and form controls, scrollable regions are focusable. Tested keyboard-only in Playwright.
- **Screen readers:** every input has a label, hints are linked with `aria-describedby`, invalid fields set `aria-invalid`, results and chat use `aria-live`, toggles use `aria-pressed`, `<html lang>` follows the language.
- **Large-text mode** scales the whole page to 125%. Touch targets are at least 44 px.
- **Motion:** one entrance animation, disabled under `prefers-reduced-motion`.
- **Low-end phones:** no chart or UI library, a self-hosted font, server-rendered HTML.
- **Verified by** axe-core (WCAG 2.1 A and AA) on mobile and desktop in CI, with zero violations allowed.
