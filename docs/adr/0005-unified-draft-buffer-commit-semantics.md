# Unified Draft Buffer commit semantics for all Field edits

Field operated in two implicit modes: entity mode (with `value` prop) wrote immediately via direct Convex mutations; section mode (without `value` prop) wrote to the Draft Buffer, flushed on save. The mode was inferred from prop presence with no type-level distinction. This violated the Edit Session contract — discarding a session did not revert entity field edits — and created a copy-paste trap where moving a Field between contexts silently changed its commit timing.

## Decision

All Field edits write to the Draft Buffer. The `value`/`onChange` prop pair is removed from Field. Entity fields use virtual sections (section name `"project:{id}"` or `"post:{id}"`) so the Field component and `write(section, field, locale, value)` API remain unchanged. The flush logic routes by section name prefix: virtual sections dispatch to entity-specific mutations (`projects.update`, `blogPosts.update`); real sections dispatch to `siteContent.upsert` as before.

## Key design choices

**Virtual sections over separate data structures:** Entity fields reuse the existing section/field/locale key format rather than introducing a parallel map. This keeps the Field component unchanged and means the change summary dialog naturally groups entity changes by section label.

**Section `label` prop:** Sections accept an optional `label` for human-readable display in the change summary (e.g., "Project: Solstice"). General-purpose — not limited to virtual sections.

**Slug derivation in Draft Buffer:** When the EN title field changes, the slug re-derives and is stored in the Draft Buffer alongside the title. A `useSlugDerivation` hook encapsulates derivation, reactive uniqueness checking, and Chrome status feedback. The slug commits atomically with the title on save; `router.replace` fires after the mutation succeeds. Applies to both Projects and Posts.

**`useStableEntity` hook:** Entity detail pages resolve slug to ID on mount, then subscribe by ID. This prevents 404 flashes when the slug changes on save. The hook also triggers `router.replace` when it detects the entity's slug has changed post-save.

**Session-Created Entities keep immediate write:** A new entity is written to the database immediately (as Unpublished) because it needs a real ID and URL route. Subsequent field edits during the session are draft. This asymmetry already exists and is documented.

## Consequences

- The `value` and `onChange` props are removed from Field. Entity detail pages wrap their fields in a Section with a virtual section name and a `label`.
- The Draft Buffer flush logic gains a routing step: inspect section name prefix to choose the target mutation.
- `getById` queries must be added to `convex/projects.ts` and `convex/blogPosts.ts`.
- ADR-0003's slug derivation design (previously unimplemented) is now implemented within the Draft Buffer model, for both Projects and Posts.
