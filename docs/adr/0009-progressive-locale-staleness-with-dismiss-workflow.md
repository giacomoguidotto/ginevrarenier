# Progressive locale staleness with dismiss workflow

The current stale-locale detection is unreliable: structural operations (entity creation, deletion, publish overrides, reorder) pollute the locale change signal, and flat per-field amber dots don't guide the artist to where attention is needed. We're redesigning locale change tracking around three principles: staleness scoped to text edits only, progressive disclosure through a three-tier hierarchy (locale toggle → page boundary → per-field), and a dismiss workflow that lets the artist acknowledge stale fields without editing them.

## Considered options

**Staleness detection:**

- *Content-aware diffing* (compare old/new values to decide if translation-relevant) — rejected because false negatives hide real issues. A mechanical check with a dismiss escape hatch is safer.
- *Pre-annotating fields as locale-independent* (mark certain fields like `year` as never triggering staleness) — rejected as too rigid. The artist's intent varies per session; she may want to translate a project title one time and leave it as-is another time.
- *Mechanical detection + dismiss* (chosen) — if a field was edited in locale A but not resolved in locale B, it's stale. Resolution: manual edit, auto-translation, or explicit Dismissal. Dismissals reset when the source locale is re-edited.

**Visual indicators:**

- *Four-state dots (green/blue/amber/red)* with green for manual edits — rejected because the green "you edited this" dot is redundant (the artist knows what she just typed) and four colors create a dashboard, not a hint system.
- *Two active states + one reserved* (chosen) — amber (warning: needs attention) and blue (info: system-filled, e.g. auto-translated). Red reserved for future error states. The dot component accepts a semantic state (`info | warning | error`), a label, and an optional action — domain-agnostic by design.

**Page-level aggregation:**

- *Static page→section map* — rejected because it requires manual maintenance.
- *Dynamic Page Boundary registration* (chosen) — Sections register with their nearest Page Boundary on mount, providing name and label. No bootstrapping issue because stale fields can only exist on pages the artist already visited and edited.

## Consequences

- The Draft Buffer gains a Dismissal store (field-locale pairs) alongside its existing text edit store. Dismissals are excluded from stale indicators and the save summary.
- The save confirmation dialog retains its single-locale warning as a backstop for undismissed stale fields, but its content becomes more precise ("N undismissed stale fields" with human-readable labels).
- Section labels must flow from the Section component through the Page Boundary to the Draft Buffer's change summary. The `formatEditLabel` function will resolve section names to labels instead of showing raw keys.
- An on-focus tooltip on Fields shows the human-readable Section label + Field name, styled to match the Chrome design language (spec only — Chrome is being reimplemented and the tooltip design will be resolved there).
- Auto-translation is a batch operation ("translate all stale fields") that writes to the Draft Buffer and shows blue info dots. The translation engine is deferred — the architecture provides a hook point but doesn't commit to a specific service.
- The public site keeps its full-reload locale switch. The cost of fighting Next.js's `[locale]` routing model exceeds the benefit for this rare visitor action.
