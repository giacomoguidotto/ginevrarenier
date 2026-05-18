# Buffer all entity state changes through the Draft Buffer

Publish and reorder fired Convex mutations immediately, bypassing the Draft Buffer. Text edits, Pending Deletions, and Session-Created Entities already routed through the Draft Buffer (ADR-0005). This split meant discarding a session could not revert a publish or a reorder — the Edit Session contract ("discard reverts everything") was partially broken. It also prevented a coherent change summary: the confirmation dialog could not show publish or reorder changes alongside text edits.

## Decision

All entity state changes — publish/unpublish and reorder — route through the Draft Buffer. The Draft Buffer gains two new data structures:

**Publish Overrides** (`Map<entityKey, boolean>`): Records the intended publish state for entities whose visibility was toggled during the session. Absent entries mean "no change." On save, each override dispatches a `projects.update` or `blogPosts.update` mutation with the `published` field. On discard, cleared.

**Reorder list** (`Map<entityType, string[]>`): Records the full ordered ID list for a given entity type. Absent until the first drag-and-drop during the session. New Session-Created Entities are appended to the list if it exists. On save, dispatches a `reorder` mutation with the ID list (filtering out Pending Deletion IDs). On discard, cleared. Applies only to entity types with explicit ordering (Projects, not Posts).

The UI renders the Draft Buffer's intended state: a project with a Publish Override of `true` appears at full opacity with a "Pending publish" badge, regardless of the database value. Pending-deletion entities are not draggable.

The `ChangeSummary` type gains `publishOverrides` (list of entity refs with their target state) and `reordered` (set of entity types whose order changed).

## Key design choices

**Publish Override over toggle set:** Storing the target boolean rather than a toggle bit lets the system detect no-ops (override matches DB value) and display directional intent ("Will publish" vs. "Will unpublish") in the change summary.

**Full ID list over move deltas:** The reorder list stores the complete ordering rather than individual move commands. This avoids delta composition complexity when multiple drags happen during a session, and naturally handles interleaved creations and deletions.

**Pending-deletion items not draggable:** Simplifies the reorder list — deleted items stay in place visually but are filtered from the reorder mutation on save.

## Consequences

- The Draft Buffer's serialization format (`SerializedDraftBuffer`) grows by two fields: `publishOverrides` and `reorderLists`. Existing persisted sessions (localStorage) are forward-compatible — missing fields default to empty.
- The save flow gains two new routing steps after text edits and before deletions: apply Publish Overrides, then apply reorder.
- Both the Vision (Projects) and Reflections (Posts) pages adopt Publish Override buffering. Only Vision adopts reorder buffering (Posts sort by date, not order).
- The `changeSummary()` output grows, and the confirmation dialog needs corresponding UI for the new change types.
- Server-side preloading (`preloadQuery` for `listPublished`) is added separately to eliminate the loading flash on public page views. Admin views fall back to skeleton cards during the Convex query handshake.
