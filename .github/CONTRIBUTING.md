# Contributing

Thanks for your interest in Ginevra Renier Studio! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

This is a personal project with a specific vision, so contributions are accepted on a **limited basis**.

## What we accept

- **Bug fixes**: if something is broken, we'd love a fix.
- **Documentation improvements**: typo fixes, clarifications, and better examples.
- **Accessibility improvements**: making the site more accessible benefits everyone.
- **Security fixes**: please report these responsibly (see [SECURITY.md](../SECURITY.md)).

## What we don't accept

- **Unsolicited features**: please don't open PRs for new features without first discussing them in an issue.
- **Design overhauls**: the visual identity is intentional; we won't merge changes that alter the look and feel.
- **Refactoring for its own sake**: unless it fixes a concrete problem.

## Setup

1. Fork and clone the repo, then install dependencies:

    ```sh
    bun install
    ```

    > **Optional:** If you use [mise](https://mise.jdx.dev), run `mise install` first to
    > provision the pinned `node` and `bun` versions from `mise.toml`.

2. Start the dev server (Next.js + Convex):

    ```sh
    bun run dev
    ```

3. Before pushing, run the full CI check locally:

    ```sh
    bun run ci
    ```

    This runs lint, typecheck, test, and build, the same pipeline as CI.

## Workflow

1. **Open an issue first.** Describe the bug or improvement. Wait for a maintainer to confirm it's something we'd accept before writing code.
2. **Fork the repository** and create a branch from `main`.
3. **Keep the scope small** and focused on a single concern.
4. **Open a pull request** against `main`. Reference the issue it addresses.

## Tooling

- **Runtime / package manager**: [Bun](https://bun.sh)
- **Backend**: [Convex](https://convex.dev). Never edit `convex/_generated/`
- **Linting & formatting**: [Biome](https://biomejs.dev) via ultracite, not ESLint or Prettier
- **Tests**: [Vitest](https://vitest.dev) (unit) / [Playwright](https://playwright.dev) (E2E, `e2e/*.spec.ts`)

## Conventions

- Branch names: `feat/`, `fix/`, `docs/`, etc.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- Components: PascalCase. Utilities/hooks: camelCase. Constants: SCREAMING_SNAKE_CASE
- Convex functions must have `args`, `returns`, and `handler`

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](../LICENSE).
