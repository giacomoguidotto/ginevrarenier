# Use contentEditable="plaintext-only" with a parallel editing module

Status: Accepted
Amended by: ADR-0008 for Chrome rendering

The current editing system (`EditableText`) swaps DOM elements — an `<h1>` becomes an `<input>` when clicked — causing cumulative layout shift and coupling every page component to edit-mode awareness. We're replacing this with `contentEditable="plaintext-only"` on the original DOM elements, organized into a parallel editing module (Chrome, Draft Buffer, Section/Field) that layers editing onto the presentation without modifying it.

## Considered Options

**Input/textarea swap (current):** Each `EditableText` component checks `isEditMode` and renders either a display element or a form input. Simple to implement, but guaranteed CLS on every edit interaction, and edit-mode branching spreads into every component.

**Overlay/portal inputs:** Render invisible inputs positioned over display elements. Avoids modifying the component tree but position synchronization is fragile with scroll, resize, and Framer Motion animations.

**contentEditable="plaintext-only" (chosen):** The display element itself becomes editable. Zero CLS by definition — same element, same box model, same styles. Became Baseline in March 2025 (Chrome 134, Firefox 136, Safari 18.4). Quirks (cursor jumping, paste handling) are mitigated by the uncontrolled DOM approach (never let React touch textContent while the user is typing) and the browser's native plaintext-only paste stripping.

## Consequences

- `renderDisplay` prop is eliminated — visual styling is handled by CSS (`::first-line`, `white-space: pre-wrap`) rather than React children, because the browser owns the element's content during editing.
- Chrome rendering is current only as amended by ADR-0008: Chrome is per-Field, moves with the Field DOM, and does not rely on a global geometry overlay.
- Field lifecycle (mounted → visible → active) must integrate with Framer Motion's animation callbacks to avoid drawing Chrome on elements that haven't finished entering.
