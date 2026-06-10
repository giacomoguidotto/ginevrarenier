# SEO Infrastructure

Status: Accepted

The site had no sitemap, robots.txt, structured data, or dynamic metadata for individual projects and blog posts. Search engines could crawl the site but had limited ability to understand its content, surface rich results, or index images.

## Decision

Implement a comprehensive SEO layer in one pass, with two items deferred to a follow-up:

### Shipped now

1. **`robots.ts`** — allows all crawlers, disallows `/api/` and `/sign-in`, points to sitemap.
2. **`sitemap.ts`** — dynamic sitemap fetching published Projects and Posts from Convex via `fetchQuery`, covering both locales, with image entries for project galleries.
3. **JSON-LD structured data** — `Person` (Ginevra Renier, Photographer, social links from DB), `WebSite` on root layout, `BlogPosting` on each post, `ImageGallery` on each project, `BreadcrumbList` on all pages.
4. **Dynamic page metadata** — `generateMetadata` on `/reflections/[slug]` and `/vision/[project]` using `fetchQuery` for unique titles, descriptions, canonical URLs, hreflang, and OG tags per locale.
5. **Open Graph images** — Next.js `opengraph-image.tsx` compositing the cover photo into a branded template with the page title. Pages without a cover fall back to a static image at `/public/og-default.jpg` (to be supplied by the artist).
6. **Image alt text (derived)** — gallery images use `"Photography by Ginevra Renier — {project title}, image {N}"` instead of the previous generic `"Photograph {N}"`.
7. **Author correction** — layout metadata author changed from developer name to artist name.

### Deferred

- **Per-image caption field**: add a localized `caption` field to `projectImages` so each photo can have a unique, hand-written alt text. Requires a schema migration (widen with optional field, backfill, then narrow) and admin UI for entering captions inline. Tracked as a follow-up issue.

## Consequences

- Google can now discover all public pages and images via the sitemap, understand content structure via JSON-LD, and display rich results for blog posts and the artist's profile.
- Social sharing on all platforms shows page-specific preview images and descriptions instead of a generic fallback.
- The derived alt text is a stopgap. Once the caption field ships, alt text quality improves from formulaic to descriptive, which benefits both accessibility and image search ranking.
- `fetchQuery` calls in `generateMetadata` and the sitemap add server-side Convex reads at build/request time. These are lightweight point-in-time reads, not subscriptions.
