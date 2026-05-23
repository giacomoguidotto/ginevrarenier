# Inline read functions in the Draft Buffer ops memo

Draft Buffer read functions (`isPendingDeletion`, `getPublishOverride`, `isSessionCreated`, `getReorderList`, `read`, `editedLocales`, `sectionChanges`) were wrapped in `useCallback(fn, [])`. The functions read from a mutable ref (`bufferRef.current`) so they always returned fresh data in theory. In practice, React Compiler (or equivalent automatic memoization in React 19 / Next.js 16) cached the call-site return values: when both the function reference and its arguments were unchanged between renders, the runtime skipped re-executing the function body entirely. Write operations bumped `editVersion` and triggered re-renders, but consumers called the same stable function reference with the same arguments, so the cached (stale) result was returned. The UI never reflected deletions, publish toggles, or other buffer mutations.

## Decision

Read functions are no longer individually `useCallback`-wrapped. They are defined inline inside the `ops` `useMemo`, which includes `editVersion` in its dependency array. When any write operation increments `editVersion`, the memo recomputes, producing fresh function identities for all read operations. This defeats call-site memoization because the function references change.

Write functions (`trackDeletion`, `cancelDeletion`, `write`, `setPublishOverride`, etc.) remain individually `useCallback`-wrapped with `[schedulePersist]` deps, unchanged.

## Key design choices

**Inline in memo over `useCallback` with `editVersion` dep:** Biome's `useExhaustiveDependencies` rule flags `editVersion` as unnecessary in a `useCallback` whose body only accesses `bufferRef.current` (a ref, not a reactive value). Inlining the read functions into the `ops` memo avoids eight separate lint suppressions in favor of one on the memo itself.

**Single `editVersion` counter over granular subscriptions:** The existing counter already increments on every buffer mutation. Making the ops memo depend on it is the minimal change that restores correctness. Granular per-key subscriptions would reduce unnecessary re-renders but add substantial complexity for no measurable benefit at current scale.

## Consequences

- `OpsContext` value changes on every buffer mutation (previously it was referentially stable forever). Consumers of `useDraftBufferOps()` re-render when the buffer changes, regardless of whether they also call `useEditVersion()`. This is correct behavior -- any component reading buffer state should see updates.
- Components that previously required `useEditVersion()` purely for reactivity no longer need it, though keeping it is harmless and makes the subscription intent explicit.
- The `useExhaustiveDependencies` suppression on the ops memo is permanent and intentional. Removing it would reintroduce the stale-closure bug.
