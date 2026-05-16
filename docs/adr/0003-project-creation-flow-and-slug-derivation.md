# Simplified project creation flow with slug derivation from title

The current project creation flow requires the user to type a slug manually in an inline modal, then stay on the vision grid. The slug is a technical concept that shouldn't face the user. We're replacing this with one-click creation (random evocative title, focused for editing), automatic slug derivation from the EN title, and a reactive uniqueness guard surfaced through Chrome variants.

## Considered Options

### Creation flow

**Manual slug input (current):** Press "+" → inline card with slug text input → Create/Cancel. The slug is the primary input; title is initialized to the slug value. Requires the user to think in URL terms.

**Auto-route to project page:** Press "+" → project created → navigate to `/vision/{slug}`. Problem: new projects have empty titles, so the initial slug is undefined. Either a placeholder slug is needed (URL instability when renamed) or a title input gate is needed anyway.

**One-click inline creation (chosen):** Press "+" → project created immediately with a random title from a hardcoded collection of ~20-30 evocative words (e.g., "Solstice", "Penumbra", "Aperture"). Title field is focused on the card for editing. Slug is derived from the EN title on blur. No navigation — the user stays on the grid.

### Slug derivation and routing

**Immutable slug:** Slug set once from the initial title, never updates. Simple, no routing issues, but slug and title drift apart over time.

**Slug updates + redirect (chosen):** Slug re-derives from EN title on every blur. On the project page, the component resolves the slug to a project ID on initial load, then switches to a `getById` subscription. When the slug changes via mutation, `router.replace` updates the URL. The ID-based subscription prevents the 404 flash that would occur if the component relied on `getBySlug` throughout.

**ID-based URLs:** Use `/vision/{id}` instead of `/vision/{slug}`. Avoids all slug issues but produces ugly URLs. Rejected.

### Slug uniqueness guard

**Server-side mutation validation:** The `update` mutation checks uniqueness and returns `{ ok: false }` on collision. Single round-trip and atomic, but bends the Convex mutation pattern (mutations are expected to succeed or throw).

**Reactive client-side query (chosen):** On title blur, derive the slug and set it as `pendingSlug` state. A `useQuery(getBySlug, { slug: pendingSlug })` subscription resolves reactively. If it returns a project with a different ID, the mutation is blocked and Chrome shows the error state. Three Chrome states for the flow:

- **Loading:** Input disabled, glowing outline and hatching (during query round-trip, ~50-100ms).
- **Error:** Subtle red outline, red hatching, red dot with tooltip "project '{slug}' already exists". Mutation blocked.
- **Success:** No collision. Mutation fires, slug updates, `router.replace`, Chrome returns to normal.

The TOCTOU race (check-then-act) is irrelevant for a single-user portfolio CMS.

## Other decisions made in this context

### Card layout redesign

- **At rest:** Cover image + title below the image.
- **On hover:** Title + tagline overlay on the image over a gradient from the bottom.
- **Edit mode:** All cards locked in hovered state (hover animation disabled). Title and tagline are `<Field>` components, editable in place without cursor displacement.

### Category → Tagline rename

The `category` schema field is renamed to `tagline`. The former "PORTRAIT" / "LANDSCAPE" usage was already a short creative label, not a real taxonomy. The project page `subtitle` field remains separate for longer text. Schema migration + data backfill required.

### Publish button placement

Currently publish/unpublish is hidden in a right-click context menu. Moving to explicit buttons in two locations:

- **On the card:** Subtle publish button, visible in edit mode on unpublished projects.
- **On the project page:** Prominent publish button in the header when the project is unpublished.

The context menu retains publish/unpublish as a secondary path for quick toggling.

### "Draft" badge terminology

The UI badge label stays "Draft" (user-friendly). The domain/code term stays "Unpublished" per the glossary in CONTEXT.md, which notes "Draft" is overloaded with Draft Buffer. No glossary conflict — the distinction is UI-facing label vs. code-level language.

## Consequences

- A `getById` query must be added to `convex/projects.ts` for the project page to hold a stable subscription across slug changes.
- The Chrome overlay gains two new visual variants (loading, error) in addition to the existing normal and stale-locale states.
- The `category` → `tagline` rename requires a Convex schema migration with data backfill and updates to all references across frontend components and backend functions.
- The card component needs a layout restructure: text moves from below-image to an overlay on hover, with a CSS toggle for edit mode.
- A hardcoded array of placeholder project names is added client-side.
