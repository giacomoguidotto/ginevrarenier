# Entity Descriptor Registry

The Draft Buffer save flow, confirmation dialog, and Session-Created Entity discard all routed entity operations through hardcoded if/else chains keyed on entity-type string literals (`"project"`, `"post"`). Adding a new entity type required updating every branch in save routing, publish-override dispatch, removal compensation, and UI formatting. The branches were scattered across `save-routing.ts`, `edit-toolbar.tsx`, and `draft-buffer-context.tsx`.

## Decision

Introduce an **Entity Descriptor** — a static data structure per entity type that declares its capabilities and backend references — and a **registry** that maps entity-type strings to descriptors.

```typescript
interface EntityDescriptor {
  type: string;
  label: string;
  formatRef: (id: string, sectionLabels: ReadonlyMap<string, string>) => string;
  mutations: { update: FunctionReference; remove: FunctionReference };
  collection?: { list: FunctionReference; getByKey?: FunctionReference };
  publish?: { listPublished: FunctionReference };
  reorder?: { mutation: FunctionReference };
  parent?: { entityType: string };
  localized: boolean;
}
```

**Capability-as-object pattern:** Optional capabilities (`collection`, `publish`, `reorder`, `parent`) are present as objects when supported and `undefined` when not. This replaces boolean flags with self-describing structures — checking `descriptor.reorder` simultaneously answers "can this entity be reordered?" and provides the mutation reference.

**Routing refactor:** `routeSection()` now returns `{ kind: "entity"; descriptor; id }` for registered entity prefixes (replacing the per-type `{ kind: "project" }` / `{ kind: "post" }` variants) and `{ kind: "siteContent"; section }` for everything else. Save dispatch branches on `route.kind` and uses `descriptor.type` to look up the corresponding mutation function.

**Formatting refactor:** `formatEntityType()` and `formatEntityRef()` move from inline functions in `edit-toolbar.tsx` to the registry module. They look up the descriptor's `label` (or `formatRef` for instance-specific labels from the section-label map) and fall back to a humanized type string for unregistered entity types (e.g., timeline entries, which are not yet migrated).

**Mutation dispatch:** `draft-buffer-context.tsx` builds an `entityMutations` map at hook level (since `useMutation` must be called unconditionally). The save and discard flows index into this map by entity type — no if/else chains.

## Key design choices

**Registry over type union:** A `Map<string, EntityDescriptor>` is open for extension — adding a new entity type means adding one entry to the registry and one entry to the mutation map. A discriminated union requires updating every switch/if-else that matches on it.

**formatRef on the descriptor:** Each descriptor owns its label-resolution strategy. The default implementation checks the section-label map and falls back to the descriptor's static label. Future entity types with different labeling conventions (e.g., parent-qualified labels) can override this.

**Mutation map separate from descriptors:** The descriptor registry is a static module-level data structure with Convex `FunctionReference` values. The React component needs `useMutation`-bound functions, which must be called as hooks. The `entityMutations` map bridges this gap — it's built once in the provider and indexed by entity type at dispatch time.

## Consequences

- `SectionRoute` changes from a 3-variant union to a 2-variant union. The old `{ kind: "project" }` and `{ kind: "post" }` variants collapse into `{ kind: "entity"; descriptor; id }`. Existing `save-routing.test.ts` assertions are updated accordingly.
- `formatEntityType` and `formatEntityRef` are removed from `edit-toolbar.tsx` and re-implemented in `entity-descriptors.ts` using the registry, with a humanized fallback for unregistered types.
- The old `save-routing.ts` retains `buildEntityUpdates` and `mergeSiteContent` (pure data-transformation functions unrelated to entity dispatch).
