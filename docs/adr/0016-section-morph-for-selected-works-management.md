# Section Morph for Selected Works Management

The admin needs to manage which Projects appear as Selected Works on the home page, and in what order. This requires a UI that combines two operations: toggling selection membership and reordering.

## Decision

The Selected Works carousel section on the home page transforms in-place into a full-width grid when the admin activates curation mode. The same DOM section morphs between a read-only carousel layout and an interactive grid layout, animated with Framer Motion `layoutId` transitions.

### Interaction model

In edit mode, a grid icon appears in the section header alongside the existing scroll arrows. Clicking it morphs the horizontal carousel into a grid showing all Projects (selected and unselected). The scroll arrows disappear and the grid icon becomes a close icon. Closing morphs back to the carousel. Opening and closing the grid is purely a UI state change — all selection and reorder changes are buffered in the Draft Buffer and committed only when the Edit Session is saved.

Inside the grid, all projects are draggable regardless of selection state. Tapping a project toggles its selection (Selection Override in the Draft Buffer). Selected projects are visually distinct: full saturation and an elevated effect (border glow on dark theme). Unselected projects appear desaturated. A project's order value in the selectedWorks table equals its position index in the grid, so dragging inherently reorders.

### Alternatives considered

**Modal picker dialog.** A standard dialog showing all projects in a grid, with tap-to-toggle selection. Rejected because it breaks the inline editing philosophy — the admin would leave the page context to manage content that lives on that page. Modals are also a solved, unremarkable pattern; the site's editing UX is a differentiator worth extending.

**Scrollable card list from a + button.** A horizontally scrollable panel showing one project card at a time, opened by a + button in the carousel. Rejected because of nested horizontal scroll conflicts, poor mobile usability (two scroll contexts on a narrow viewport), and inability to see more than one candidate at a time.

**Dual-track shelf.** Two parallel horizontal scroll rows — selected works on top, available projects below — with projects animating between them on tap. Rejected because two horizontal scroll tracks stacked vertically is disorienting on mobile and the interaction model (which track am I scrolling?) is ambiguous.

### Order model

Grid position is the canonical order. When a project at grid index N is selected, its `selectedWorks.order` value is N. This means selecting a project in the middle of the grid does not require reindexing other entries — it simply writes its current position. On the public carousel, selected works are sorted by `order` ascending; gaps in the sequence are irrelevant.
