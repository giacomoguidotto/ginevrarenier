# Gate admin queries on Convex auth readiness

Status: Accepted

Client-side calls to `adminQuery`-wrapped functions must be skipped until `useConvexAuth().isAuthenticated` is true, not just until the triggering UI state (e.g., `isEditMode`) is true. The Clerk-to-Convex token handshake is async: Clerk restores its session from cookies, calls `getToken({ template: "convex" })`, and delivers the JWT to the Convex client. Any Convex query that fires before this handshake completes will see `ctx.auth.getUserIdentity() === null` on the server and hit the `adminQuery` unauthorized throw (ADR-0004).

Admin operations that call `adminMutation` functions must also account for Convex auth readiness. A persisted edit session can outlive the Clerk/Convex token, so a user can resume an old browser session and click Save or Discard while Convex is unauthenticated or refreshing. Transient refreshes should be allowed to complete. A truly expired session must preserve the local draft instead of forcing a save/discard decision that cannot succeed.

The bug is timing-dependent. It surfaces when persisted client state (localStorage) activates an admin query on the first render after a page load — the query fires in the gap between React hydration and token delivery.

## Decision

Every `useQuery` call targeting an `adminQuery`/`adminMutation` function uses a skip condition that includes `isAuthenticated`:

```tsx
const { isAuthenticated } = useConvexAuth();
const data = useQuery(api.foo.adminThing, isAuthenticated ? args : "skip");
```

`useConvexAuth()` (from `convex/react`) returns `isAuthenticated: true` only after the token has been delivered to the Convex WebSocket — not merely after Clerk reports `isSignedIn`. This closes the race window.

Every shared admin operation checks `useConvexAuth()` before invoking its callback. If Convex auth is loading or refreshing, the operation waits briefly for the refreshed token before running. If auth is no longer resolving and not authenticated, the operation fails locally with a session-expired notification:

```tsx
const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth();
if (isLoading || isRefreshing) {
  await waitForAuthReady();
}
if (!isAuthenticated) {
  return { ok: false, error: new Error("Convex auth is not authenticated") };
}
```

Draft persistence is independent of `edit-mode-active`. Leaving edit mode is not the same thing as discarding a draft. The unsaved-changes dialog offers Save, Discard, Stay, and Keep draft. Keep draft flushes the local buffer immediately, exits edit mode, and does not call Convex mutations.

## Consequences

- All current admin query call sites (`siteContent.listAll`, `projects.list`, `blogPosts.list`) include the `isAuthenticated` guard.
- Future call sites to `adminQuery`/`adminMutation` functions must follow the same pattern. The server-side throw is the safety net, but the client-side skip prevents the error from reaching the UI.
- `adminMutation` calls triggered by user actions (save, discard, create, reorder, delete) run through `useAdminOperation`, which waits through transient refresh and only fails locally for genuinely unauthenticated sessions.
- Discard remains the destructive cleanup path and may need authenticated mutations to remove session-created entities. Keep draft is the non-destructive escape hatch when the user needs to leave edit mode or reauthenticate.
