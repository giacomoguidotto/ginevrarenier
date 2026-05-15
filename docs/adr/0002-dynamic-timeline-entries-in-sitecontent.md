# Dynamic timeline entries within siteContent

The Essence timeline currently uses a hardcoded array of years (`["2022", "2024", "2025"]`), with each year's title and description stored as flat keys in the `essence.timeline` siteContent blob (e.g., `2022.title`, `2022.description`). We need the admin to add and remove timeline entries during an Edit Session without touching code.

## Considered Options

**Dedicated `timelineEntries` table:** Each entry is a Convex document with year, title, description, and order fields. Gives per-row reactivity and indexing, but requires new CRUD mutations, new entity tracking in the Draft Buffer (`trackCreation`/`trackDeletion`), and new save/discard handling. Significant plumbing for a small, bounded dataset tightly coupled to a single page.

**siteContent blob with sentinel deletion:** Keep entries as flat keys in the existing blob. Use a null/sentinel value in `write()` to signal key removal on save. Minimal Draft Buffer changes, but implicit — deletion is disguised as a write.

**siteContent blob with explicit `deleteField` (chosen):** Keep entries in the existing blob but add a `deleteField(section, keyPrefix)` operation to the Draft Buffer. The entry list is derived at runtime by scanning stored keys for `*.title` patterns. Entries sort by their year value (chronological). Year values are validated as 4-digit numbers on the client.

## Consequences

- The Draft Buffer gains a new primitive (`deleteField`) alongside `write`/`read`. The save flow must strip deleted keys before upserting to Convex.
- `timelineYears` is no longer a compile-time constant. The component derives visible entries from the siteContent data merged with Draft Buffer state (additions and deletions).
- Each timeline entry stores a `{id}.year` field (a Localized Text containing the 4-digit year) alongside `{id}.title` and `{id}.description`. The id is a stable identifier (e.g., a short random string) so renaming the year doesn't orphan the title and description.
- Ordering is by year value, enforcing chronological display. No explicit order field needed.
