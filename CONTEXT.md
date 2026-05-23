# Ginevra Renier Portfolio

A bilingual (EN/IT) photography portfolio with an inline editing system that lets the site owner edit content directly on the live site.

## Language

### Content

**Entity**:
Any named content unit the Admin manages with full lifecycle (create, read, update, delete) during an Edit Session. All Entity operations route through the Draft Buffer. Each Entity type is described by a descriptor that declares its capabilities (publish, reorder, slug derivation, etc.) and backend routing. Storage mechanism varies by type (own table, siteContent fields, reference table) but is abstracted behind the descriptor.
_Avoid_: Item, resource, object, record

**Project**:
A photography project with a gallery of images, bilingual metadata, and a publication state.
_Avoid_: Album, collection, gallery (gallery refers to the UI grid, not the data entity)

**Post**:
A blog/journal entry with bilingual content stored as BlockNote JSON.
_Avoid_: Article, blog post (in code — "Reflections" is the UI-facing name for the blog section)

**Tagline**:
A short creative label for a Project, displayed on the card hover overlay and as the small-caps label on the project page. Repurposed from the former `category` field.
_Avoid_: Category (legacy name), subtitle (different field — the longer text on the project page)

**Localized Text**:
A bilingual value `{ en: string, it: string }` — the atomic unit of translatable content.
_Avoid_: Translation, i18n field, bilingual field

**Section**:
A named content area of a page (e.g., `"hero"`, `"essence.highlights"`) or a virtual section representing an entity (e.g., `"project:{id}"`, `"post:{id}"`). Contains one or more Fields. Real sections are stored as documents in the `siteContent` table; virtual sections map to entity tables. Accepts an optional `label` for human-readable display in the change summary.
_Avoid_: Block, region, zone

**Field**:
A single editable content element within a Section. Renders as a native DOM element (`h1`, `p`, `span`) that becomes `contentEditable="plaintext-only"` during an Edit Session. Always writes to the Draft Buffer — there is no immediate-commit path.
_Avoid_: Input, slot, cell

**Achievement**:
A milestone or accomplishment on the artist's timeline, displayed in the Essence page. Has a date range (`startYear`, optional `endYear`), a title, and a description. Stored in its own table with a generated ID. Ordered by `startYear`. Multiple Achievements may share the same year.
_Avoid_: Timeline entry (legacy name), milestone, award

**Selected Work**:
A reference to a Project that appears in the Featured Projects section on the home page. Does not own content — points to an existing Project via its ID. Ordered explicitly by the Admin. A Project may appear at most once in the selection.
_Avoid_: Featured project, highlight, pick

**Photo**:
An image within a Project's gallery. Stored with a Cloudinary URL and public ID. Ordered explicitly within its parent Project. One Photo per Project may be designated as the cover image.
_Avoid_: Project image, gallery image (gallery refers to the UI grid)

**Artist Image**:
A singleton portrait image associated with a specific page section (Home or Essence). Supports full CRUD: upload creates it, the Admin can replace or delete it, and the empty state is a valid "no image" state. Identified by its Cloudinary public ID. No ordering (singleton per slot).
_Avoid_: Portrait, hero image, site image

**Published / Unpublished**:
Visibility state of a Project or Post. Unpublished entities exist in the database but are hidden from the public site. Newly created entities start as Unpublished.
_Avoid_: Draft (overloaded — see Draft Buffer), hidden, archived

### Access Control

**Admin**:
The single authenticated user — the site owner. Clerk sign-ups are disabled at the dashboard level, so authentication and admin authorization are equivalent: if identity is present, the caller is the Admin.
_Avoid_: User, author, editor (no other roles exist)

### Editing

**Edit Session**:
The period between entering and exiting edit mode. All uncommitted changes live in the Draft Buffer for the duration of the session.
_Avoid_: Edit mode (use for the boolean toggle only, not the session concept)

**Draft Buffer**:
In-memory accumulator for all uncommitted operations within an Edit Session: text edits (both section fields and entity fields), image swaps, Publish Overrides, reorder changes, Pending Deletions, Dismissals, and Session-Created Entity tracking. Exposes a structured summary for confirmation dialogs. On save, routes changes to the correct backend: real sections → `siteContent.upsert`, virtual sections → entity-specific mutations (`projects.update`, `blogPosts.update`), Publish Overrides → entity publish/unpublish mutations, reorder → entity reorder mutation. Global discard reverts everything including compensating actions (image cleanup, Session-Created Entity removal).
_Avoid_: Change tracker, command buffer, undo stack

**Session-Created Entity**:
A Project or Post created during the current Edit Session. Exists in the database as Unpublished. If the session is discarded, the entity is automatically deleted from the database.
_Avoid_: Temporary entity, draft entity

**Pending Deletion**:
A Draft Buffer command marking an existing entity for deletion on save. Cancellable at any point during the Edit Session. The entity remains in the database until save is confirmed. Visually indicated by the Chrome layer.
_Avoid_: Soft delete, marked for removal

**Publish Override**:
A Draft Buffer entry recording the intended visibility state (Published or Unpublished) for an entity during an Edit Session. Present only when the intended state differs from the current database value. On save, applied as a publish/unpublish mutation. On discard, cleared. The UI renders the overridden state: cards appear at full opacity for a pending publish and dimmed for a pending unpublish.
_Avoid_: Toggle, publish flag, visibility toggle

**Chrome**:
The stateless visual layer for editing cues on Active Fields. Draws outlines (line animation as a state-transition cue), hatching, and semantic dots (warning for Stale Fields, info for system-filled content such as auto-translation). Rendered per-Field as an SVG child of the Field's DOM wrapper, so it moves, resizes, and unmounts with its Field automatically. Owns no content state — reads everything from the Draft Buffer and edit-mode state. Shows an on-focus tooltip with the human-readable Section label and Field name.
_Avoid_: Overlay, HUD, editing UI (too vague), decoration

**Image Assets**:
Module that manages Cloudinary uploads, tracks public IDs during an Edit Session, and performs cleanup on discard. Coordinated by the Draft Buffer but owns its own lifecycle.
_Avoid_: Media, uploads, files

**Stale Field**:
A Field edited in one locale but not yet resolved in another. Resolution paths: manual edit, auto-translation, or Dismissal. Only text edits create staleness — structural operations (entity creation, deletion, Publish Override, reorder) are locale-agnostic and never trigger it.
_Avoid_: Dirty field (overloaded — a field can be dirty without being stale), untranslated field

**Dismissal**:
A Draft Buffer operation acknowledging that a Stale Field does not need translation in the other locale. Excluded from stale indicators and the save summary. Automatically reset when the source locale is re-edited, since the original acknowledgment may no longer hold.
_Avoid_: Skip, ignore, suppress

**Page Boundary**:
A named component boundary grouping Sections for hierarchical change aggregation. Sections register with their nearest Page Boundary on mount, providing their name and label. Enables progressive disclosure of editing state across three tiers: locale toggle → page-level indicators → per-field indicators.
_Avoid_: Page wrapper, route boundary, layout

### Field lifecycle

**Mounted**:
A Field exists in the DOM but may be invisible (e.g., below the scroll fold, mid-entrance-animation). Not editable, Chrome not rendered.

**Visible**:
A Field's entrance animation has completed and it occupies a stable position. Chrome rendering is enabled. In an active Edit Session, becomes editable.

**Active**:
A Visible Field during an Edit Session. `contentEditable="plaintext-only"` is enabled, Chrome draws its cues, threshold constraints are enforced.

## Relationships

- A **Section** contains one or more **Fields**
- A **Field** displays one **Localized Text** value, resolved to the active locale
- A **Project** has a gallery of **Photos** and bilingual metadata; each metadata field is a **Field**
- A **Photo** is a child **Entity** of a **Project** — scoped to its parent for CRUD and display
- A **Post** has bilingual content edited via BlockNote, distinct from the **Field** primitive
- A **Selected Work** references a **Project** — it does not own content
- An **Achievement** is a standalone **Entity** with bilingual title/description and a year range
- An **Artist Image** is a singleton **Entity** — one per page slot (Home, Essence)
- The **Draft Buffer** accumulates changes from **Fields**, image swaps, **Publish Overrides**, reorder intents, **Pending Deletions**, and **Session-Created Entities** for all **Entity** types
- Each **Entity** type is described by an **Entity Descriptor** declaring its capabilities and backend routing
- **Chrome** is rendered by each **Field** as a DOM child — it reads **Draft Buffer** state but owns none
- **Chrome** renders semantic dots: warning (amber) for **Stale Fields**, info (blue) for system-filled content
- **Image Assets** are tracked by the **Draft Buffer** and cleaned up on discard
- A **Page Boundary** groups one or more **Sections**; **Sections** register with their nearest **Page Boundary** on mount
- A **Stale Field** is resolved by manual edit, auto-translation, or **Dismissal**
- A **Dismissal** is reset when the source locale of the corresponding **Field** is re-edited

## Example dialogue

> **Dev:** "When the user creates a new **Project** during an **Edit Session**, is it a **Session-Created Entity**?"
> **Domain expert:** "Yes — it's written to Convex immediately as **Unpublished**, but the **Draft Buffer** tracks it. If the user discards the session, the entity is deleted from the database."

> **Dev:** "What happens when a **Field** becomes **Visible** but edit mode is off?"
> **Domain expert:** "Nothing special — it just renders normally. The **Chrome** only draws for **Active** fields, which requires both visibility and an active **Edit Session**."

> **Dev:** "If the user switches locales, does the **Chrome** need to redraw?"
> **Domain expert:** "The **Chrome** redraws reactively — the **Field** content changes, the element reflows, ResizeObserver fires, and the **Chrome** picks up the new geometry. No special locale-switch logic in **Chrome** itself."

> **Dev:** "If the Admin edits a title in EN but not IT, what happens?"
> **Domain expert:** "The title becomes a **Stale Field**. The locale toggle shows a warning dot, the **Page Boundary** for that page shows a dot in the nav, and the **Field** itself shows an amber dot. She can resolve it by editing IT manually, auto-translating, or creating a **Dismissal** to acknowledge it's fine as-is."

> **Dev:** "What if she dismisses a **Stale Field** and then edits the EN version again?"
> **Domain expert:** "The **Dismissal** resets automatically — the original acknowledgment was for the previous EN content. The **Field** becomes stale again because the source changed."

## Flagged ambiguities

- "draft" is overloaded: **Draft Buffer** (in-memory edit session state) vs. **Unpublished** entity (persisted but hidden from public). Resolved: use "Draft Buffer" for the session concept, "Unpublished" for the persistence state. Never say "draft" alone.
- "edit mode" vs. **Edit Session**: "edit mode" is the boolean toggle (`isEditMode`). **Edit Session** is the full lifecycle including the Draft Buffer, Chrome, and Field activation. The session starts when edit mode is entered and ends on save or discard.
