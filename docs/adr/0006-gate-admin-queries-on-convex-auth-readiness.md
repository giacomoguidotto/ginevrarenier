# Gate admin queries on Convex auth readiness

Client-side calls to `adminQuery`-wrapped functions must be skipped until `useConvexAuth().isAuthenticated` is true, not just until the triggering UI state (e.g., `isEditMode`) is true. The Clerk-to-Convex token handshake is async: Clerk restores its session from cookies, calls `getToken({ template: "convex" })`, and delivers the JWT to the Convex client. Any Convex query that fires before this handshake completes will see `ctx.auth.getUserIdentity() === null` on the server and hit the `adminQuery` unauthorized throw (ADR-0004).

The bug is timing-dependent. It surfaces when persisted client state (localStorage) activates an admin query on the first render after a page load — the query fires in the gap between React hydration and token delivery.

## Decision

Every `useQuery` call targeting an `adminQuery`/`adminMutation` function uses a skip condition that includes `isAuthenticated`:

```tsx
const { isAuthenticated } = useConvexAuth();
const data = useQuery(api.foo.adminThing, isAuthenticated ? args : "skip");
```

`useConvexAuth()` (from `convex/react`) returns `isAuthenticated: true` only after the token has been delivered to the Convex WebSocket — not merely after Clerk reports `isSignedIn`. This closes the race window.

## Consequences

- All current admin query call sites (`siteContent.listAll`, `projects.list`, `blogPosts.list`) include the `isAuthenticated` guard.
- Future call sites to `adminQuery`/`adminMutation` functions must follow the same pattern. The server-side throw is the safety net, but the client-side skip prevents the error from reaching the UI.
- `adminMutation` calls triggered by user actions (save, reorder, delete) are not affected — by the time a user can interact, the token handshake has long completed.
