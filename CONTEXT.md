# Ginevra Renier Portfolio

A bilingual (EN/IT) photography portfolio with an inline editing system that lets the site owner edit content directly on the live site.

## Language

### Content

**Project**:
A photography project with a gallery of images, bilingual metadata, and a publication state.
_Avoid_: Album, collection, gallery (gallery refers to the UI grid, not the data entity)

**Post**:
A blog/journal entry with bilingual content stored as BlockNote JSON.
_Avoid_: Article, blog post (in code — "Reflections" is the UI-facing name for the blog section)

**Localized Text**:
A bilingual value `{ en: string, it: string }` — the atomic unit of translatable content.
_Avoid_: Translation, i18n field, bilingual field

**Section**:
A named content area of a page (e.g., `"hero"`, `"essence.achievements"`). Contains one or more Fields. Stored as a single document in the `siteContent` table.
_Avoid_: Block, region, zone

**Field**:
A single editable content element within a Section. Renders as a native DOM element (`h1`, `p`, `span`) that becomes `contentEditable="plaintext-only"` during an Edit Session.
_Avoid_: Input, slot, cell

**Published / Unpublished**:
Visibility state of a Project or Post. Unpublished entities exist in the database but are hidden from the public site. Newly created entities start as Unpublished.
_Avoid_: Draft (overloaded — see Draft Buffer), hidden, archived

### Editing

**Edit Session**:
The period between entering and exiting edit mode. All uncommitted changes live in the Draft Buffer for the duration of the session.
_Avoid_: Edit mode (use for the boolean toggle only, not the session concept)

**Draft Buffer**:
In-memory accumulator for all uncommitted operations within an Edit Session: text edits, image swaps, reorder changes, Pending Deletions, and Session-Created Entity tracking. Exposes a structured summary for confirmation dialogs. Global save commits all operations; global discard reverts everything including compensating actions (image cleanup, Session-Created Entity removal).
_Avoid_: Change tracker, command buffer, undo stack

**Session-Created Entity**:
A Project or Post created during the current Edit Session. Exists in the database as Unpublished. If the session is discarded, the entity is automatically deleted from the database.
_Avoid_: Temporary entity, draft entity

**Pending Deletion**:
A Draft Buffer command marking an existing entity for deletion on save. Cancellable at any point during the Edit Session. The entity remains in the database until save is confirmed. Visually indicated by the Chrome layer.
_Avoid_: Soft delete, marked for removal

**Chrome**:
The stateless visual overlay layer for editing cues. Draws outlines (line animation top-left to bottom-right), hatching, stale-locale indicators, and Pending Deletion overlays. Reads geometry from Field DOM elements via ResizeObserver and renders in a portal. Owns no content state — reads everything from the Draft Buffer and Field registration.
_Avoid_: Overlay, HUD, editing UI (too vague), decoration

**Image Assets**:
Module that manages Cloudinary uploads, tracks public IDs during an Edit Session, and performs cleanup on discard. Coordinated by the Draft Buffer but owns its own lifecycle.
_Avoid_: Media, uploads, files

### Field lifecycle

**Mounted**:
A Field exists in the DOM but may be invisible (e.g., below the scroll fold, mid-entrance-animation). Not editable, not tracked by Chrome.

**Visible**:
A Field's entrance animation has completed and it occupies a stable position. Registers with Chrome. In an active Edit Session, becomes editable.

**Active**:
A Visible Field during an Edit Session. `contentEditable="plaintext-only"` is enabled, Chrome draws its cues, threshold constraints are enforced.

## Relationships

- A **Section** contains one or more **Fields**
- A **Field** displays one **Localized Text** value, resolved to the active locale
- A **Project** has a gallery of images and bilingual metadata; each metadata field is a **Field**
- A **Post** has bilingual content edited via BlockNote, distinct from the **Field** primitive
- The **Draft Buffer** accumulates changes from **Fields**, **Pending Deletions**, and **Session-Created Entities**
- The **Chrome** layer observes **Field** geometry and reads **Draft Buffer** state — it owns no state of its own
- **Image Assets** are tracked by the **Draft Buffer** and cleaned up on discard

## Example dialogue

> **Dev:** "When the user creates a new **Project** during an **Edit Session**, is it a **Session-Created Entity**?"
> **Domain expert:** "Yes — it's written to Convex immediately as **Unpublished**, but the **Draft Buffer** tracks it. If the user discards the session, the entity is deleted from the database."

> **Dev:** "What happens when a **Field** becomes **Visible** but edit mode is off?"
> **Domain expert:** "Nothing special — it just renders normally. The **Chrome** only draws for **Active** fields, which requires both visibility and an active **Edit Session**."

> **Dev:** "If the user switches locales, does the **Chrome** need to redraw?"
> **Domain expert:** "The **Chrome** redraws reactively — the **Field** content changes, the element reflows, ResizeObserver fires, and the **Chrome** picks up the new geometry. No special locale-switch logic in **Chrome** itself."

## Flagged ambiguities

- "draft" is overloaded: **Draft Buffer** (in-memory edit session state) vs. **Unpublished** entity (persisted but hidden from public). Resolved: use "Draft Buffer" for the session concept, "Unpublished" for the persistence state. Never say "draft" alone.
- "edit mode" vs. **Edit Session**: "edit mode" is the boolean toggle (`isEditMode`). **Edit Session** is the full lifecycle including the Draft Buffer, Chrome, and Field activation. The session starts when edit mode is entered and ends on save or discard.
