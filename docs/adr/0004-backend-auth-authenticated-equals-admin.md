# Backend auth: authenticated identity equals admin

All Convex mutations and admin-only queries are gated behind custom function builders (`adminMutation`, `adminQuery`) that call `ctx.auth.getUserIdentity()` and throw if identity is absent. No subject-ID or email check is performed — if a caller holds a valid Clerk JWT, they are the admin. This relies on Clerk sign-ups being disabled at the dashboard level, making the Clerk tenant the single access-control boundary.

## Considered Options

**Identity-present check (chosen):** `getUserIdentity() !== null` is the only assertion. Simplest possible implementation — no env vars, no users table, no hardcoded IDs. The trade-off is that a Clerk misconfiguration (accidentally re-enabling sign-ups) would grant admin access to anyone who registers.

**Hardcoded subject check:** Compare `identity.subject` against an env var like `ADMIN_CLERK_ID`. Adds a second layer of defense, but introduces a configuration dependency that must be kept in sync across environments. For a personal portfolio where the blast radius of a misconfiguration is "someone can edit photography metadata," the added complexity isn't justified.

**Users table with admin flag:** Store authorized users in a Convex table and look up the caller's subject on every request. Standard pattern for multi-user apps, but this is a single-owner site with no concept of multiple users. A users table would exist solely to hold one row.

## Consequences

- A new `convex/functions.ts` file defines `adminMutation` and `adminQuery` builders.
- All 16 public mutations switch from `mutation` to `adminMutation`.
- Three queries (`projects.list`, `blogPosts.list`, `siteContent.listAll`) switch from `query` to `adminQuery`.
- `getBySlug` queries (projects, blog posts) remain public `query` but add a conditional check: return `null` for unpublished entities when identity is absent.
- If Clerk sign-up policy changes in the future, this ADR should be revisited to add a subject-level check.
