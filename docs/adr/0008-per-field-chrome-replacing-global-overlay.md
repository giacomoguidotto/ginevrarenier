# Per-field Chrome SVGs replacing global SVG overlay

Status: Accepted
Supersedes: ADR-0001 Chrome rendering consequence

ADR-0001 established Chrome as a global SVG portal overlay reading Field geometry via ResizeObserver. This worked for the initial feature but proved fragile as the editing system grew: deferred field animations, dynamic entity creation/removal, drag-and-drop reordering, and route navigation each required dedicated synchronization mechanisms (visibility gating, dismount epochs, registry pub-sub, scroll/resize listeners). Six of twelve Chrome-related commits were edge-case fixes for geometry desynchronization.

## Decision

Chrome SVGs move inside each Field component, absolutely positioned within a wrapper div (or portaled to the `containerRef` element when provided). This is the current rule: per-field Chrome is more flexible, scales with the Field model, and moves with the DOM instead of breaking away from it. The global overlay, registry, pub-sub, ResizeObserver, and dismount epoch are eliminated.

A `ChromeEnablerProvider` (boolean context with an idempotent `enable()` callback) gates Chrome rendering until the host animation completes. One provider per independently-animating group of Fields. On initial page load, `onAnimationComplete` fires `enable()`, and Chrome entrance-animates visibly. For dynamically added Fields (provider already enabled), Chrome mounts immediately but is masked by the parent's Framer Motion animation: the Field appears with Chrome already present.

Focus tracking moves from global document listeners with registry lookup to per-field `onFocus`/`onBlur` on the contentEditable element.

## Key design choices

**SVG inside DOM tree, not portal to body.** The root cause of every edge case was geometric desynchronization between a global SVG portal and the Field DOM. Making Chrome a DOM child of the Field eliminates the entire class of synchronization bugs: Chrome moves, resizes, animates, and unmounts with its Field automatically. Drag-and-drop reorder, deferred rendering, and navigation all work for free.

**Idempotent enable over per-field registration.** `ChromeEnablerProvider` holds a boolean, not a field set. `enable()` is called from `onAnimationComplete` on the motion wrapper. First call flips the boolean; subsequent calls (from dynamically added entries) are no-ops. Fields check `enabled && isEditMode` to render Chrome. This replaces the registry, pub-sub, visibility tracking, and dismount epoch with a single boolean context.

**containerRef portal preservation.** Four CTA Fields use `containerRef` pointing to a Link or Button element. When `containerRef` is provided, the Chrome SVG portals into that container (with `position: relative` applied dynamically during edit mode), drawing Chrome around the container rather than the Field's wrapper div.

**Line-draw animation becomes a state-transition cue.** On edit-mode entry, Fields get the visible stroke-dashoffset line-draw animation (signaling the context change). Dynamically added Fields get Chrome-already-present, masked by their parent's entrance animation. The animation signals state transitions rather than decorating every mount.

## Consequences

- `chrome-registry.ts`, `chrome-overlay.tsx`, `chrome-dismount-on-navigate.tsx` are deleted. `field-visibility.tsx` is deleted; its role is absorbed by `ChromeEnablerProvider`.
- `chrome-context.tsx` is rewritten as `ChromeEnablerProvider` (~15 lines).
- `field.tsx` gains a wrapper div and renders a `FieldChrome` component (SVG outline, hatching, stale-locale dot).
- `layout.tsx` removes `ChromeProvider`, `ChromeOverlay`, and `ChromeDismountOnNavigate`.
- All `FieldVisibilityProvider` usages (14 files) migrate to `ChromeEnablerProvider` with the same composition pattern (`onAnimationComplete={enable}`).
- `trackViewport` is eliminated. `onAnimationComplete` only fires when the animation plays (e.g., via Framer Motion's `whileInView`), so viewport gating is inherent.
- The 0.5px stroke may clip at `overflow: hidden` ancestors. Accepted: Chrome visuals draw within the Field box.
- ADR-0001's consequence ("Chrome must track animated, resizing elements without being in their DOM subtree") is superseded.
- Six test files require rewriting.
