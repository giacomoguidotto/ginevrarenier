<p align="center">
  <img src="https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png" alt="Ginevra Renier Studio" width="160" />
</p>

<h1 align="center">Ginevra Renier Studio</h1>

<p align="center">
  <strong>A personal portfolio for an artist who sees the world differently.</strong><br>
  <sub>Next.js 16 &middot; Convex &middot; Clerk &middot; Tailwind CSS 4</sub>
</p>

<p align="center">
  <a href="https://github.com/giacomoguidotto/ginevrarenier/actions"><img src="https://github.com/giacomoguidotto/ginevrarenier/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/giacomoguidotto/ginevrarenier/blob/main/LICENSE"><img src="https://img.shields.io/github/license/giacomoguidotto/ginevrarenier" alt="License"></a>
</p>

<br>

Some people write letters. I built a website. ❤️

This is a personal website I made as a gift for my girlfriend, so she could have a place to share her artistic journey with the world. A home for her photography, her thoughts, and everything I can keep up with, designed with the same care she puts into her art.

---

## ✨ What's inside

> 📷 **Her vision**
> A photography portfolio with masonry grids, a full-screen lightbox with keyboard navigation, and smooth clip-path image reveals.

> 📝 **Her reflections**
> A blog powered by BlockNote's block editor, with scroll progress indicators and dynamic OG images generated from cover art.

> 🌿 **Her essence**
> An about page with a timeline of key moments in her career.

> 💌 **A way to connect**
> A contact form with inquiry routing, Cloudflare Turnstile bot protection, and emails rendered with React Email and delivered via Resend with retry logic.

> ✏️ **Her editor**
> A live inline editing overlay where she can update almost everything on the website without writing code or re-deploying.

---

## 🔧 Under the hood

The real complexity lives in the editing experience. Signed-in users see a floating button that activates edit mode, turning the live site into a CMS.

<details>
<summary>🖊️ <strong>Inline editing</strong></summary>
<br>

Content fields become `contentEditable` in place. No separate admin panel, no page builder. The same DOM element that visitors see is the one you edit.

Editable fields get animated SVG borders with dashed stroke animations. Semantic status dots warn when a field is stale or auto-filled.
</details>

<details>
<summary>💾 <strong>Draft buffer</strong></summary>
<br>

All changes are tracked in memory and persisted to localStorage, surviving page reloads. Nothing hits the database until you explicitly save.
</details>

<details>
<summary>🌍 <strong>Bilingual content</strong></summary>
<br>

Every text field stores both English and Italian. A locale switcher in the toolbar lets editors update each language independently, with staleness detection that flags which translations are out of date.
</details>

<details>
<summary>🔀 <strong>Drag-and-drop everywhere</strong></summary>
<br>

Projects, gallery images, and social links are all reorderable via dnd-kit. Dragging an image over the trash zone deletes it; dragging it to the cover zone sets it as the project thumbnail.
</details>

<details>
<summary>☁️ <strong>Cloudinary asset management</strong></summary>
<br>

Images upload to Cloudinary with folder organization per project, and deletions cascade to the CDN.
</details>

<br>

The rest of the stack is designed to stay out of the way:

| | |
|---|---|
| ⚡ **Real-time sync** | Convex subscriptions. Edits from one tab show up instantly in another. |
| 🎞️ **Animations** | Framer Motion powers page transitions, staggered list reveals, hover overlays, and a custom `easeOutExpo` curve. |
| 🔍 **SEO** | JSON-LD structured data, canonical URLs, hreflang alternates, and dynamic OG images per blog post. |
| 🛡️ **Rate limiting** | Inquiry submissions are capped per email and globally to prevent abuse. |

---

## 🧰 Tooling

| Tool | Purpose |
|------|---------|
| [Bun](https://bun.sh) | Runtime and package manager |
| [mise](https://mise.jdx.dev) (optional) | Toolchain provisioning |
| [Convex](https://convex.dev) | Real-time backend |
| [Biome](https://biomejs.dev) | Linting and formatting |
| [Vitest](https://vitest.dev) | Unit testing |
| [Playwright](https://playwright.dev) | E2E testing |

All checks (lint, typecheck, test, build) are available via `bun run ci`.

---

## 🤝 Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines. Contributions are accepted on a limited basis: bug fixes, docs, and accessibility improvements are welcome.
