# Social Link Platform Registry with Derived Fields

The `socialLinks` table stored four free-text string columns — `platform`, `label`, `value`, `href` — all independently editable. The edit UI rendered a card-based form exposing all four fields, causing layout shift (CLS) relative to the view-mode layout and requiring the artist to manually keep label, value, and href consistent with the chosen platform. Adding a new platform meant knowing the correct URL format and typing it by hand.

## Decision

Replace the four free-text fields with two: `platform` (a closed string enum) and `handle` (the platform-specific identifier). A **platform registry** maps each enum value to its icon, display label, href template, display format, and validation rules. All read sites derive label, href, and display value from the registry at render time rather than reading them from the database.

**Platform registry entry shape:**

```typescript
{
  key: "instagram",
  label: "Instagram",
  icon: InstagramIcon,              // createLucideIcon SVG
  hrefTemplate: "https://www.instagram.com/{handle}/",
  displayFormat: "@{handle}",       // visitor-facing
  validate: (handle) => boolean,    // light validation
}
```

**Edit mode UX:** The view-mode layout is preserved — no CLS. The label text becomes a dropdown selector trigger (accordion-style, pointer cursor) listing all platforms as `[icon] [label]` rows. Selecting a platform updates the icon, label, and URL template inline. The handle is the only free-text input, shown within the full URL template (e.g., `https://www.instagram.com/▍`) so the artist sees exactly what the link resolves to.

**Schema migration:** Existing records have their handle extracted from the `href` field by stripping the known platform URL prefix. The `label`, `value`, and `href` columns are dropped.

## Key design choices

**Derive at read time, not write time:** The alternative — auto-populating `label`/`href` on write and keeping them in the schema — avoids changing read sites but scatters derivation across every write path and leaves stale data if the registry's URL templates ever change. A single derivation function called at render time keeps reads consistent without migration.

**Closed enum over free-text:** A closed set of platforms (18 initially) enables per-platform icons, URL templates, display formatting, and validation. Free-text platform names offered flexibility that was never used — every social link maps to a known service.

**Hand-crafted Lucide-style SVGs over icon library:** Brand icon libraries (Simple Icons, react-icons) use filled/solid style that clashes with the site's Lucide stroke aesthetic. Defining SVGs via `createLucideIcon` — the same pattern already used for Instagram — keeps visual consistency with no new dependency.

**Light validation over strict:** Non-empty check for all platforms, email format for email, URL format for website. Per-platform handle regex (character sets, length limits) is brittle as platforms change their rules and adds friction without preventing meaningful errors.

## Consequences

- The `socialLinks` schema changes from `{ platform, label, value, href, order }` to `{ platform, handle, order }`. A Convex migration extracts handles from existing href values.
- Every read site (`connect-client.tsx`, `footer.tsx`, and any future consumer) calls the registry's derivation functions instead of reading `label`/`href` directly. This is a one-time update.
- The social icons module (`social-icons.ts`) expands from 2 entries to 18, with SVG definitions for each platform.
- The edit-mode UI no longer swaps to a card-based layout. Social links render identically in view and edit mode, with the label gaining a dropdown affordance and the handle becoming an inline editable field.
- Adding a new platform requires one registry entry — no schema change, no migration, no UI change.
