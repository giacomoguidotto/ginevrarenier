**Always run lint and typecheck** before reporting the task as complete.

When implementing UI changes, **always check visually the correctness** by using Playwright to read screenshot of the dev server. **Assume the dev server is already running**. If uncapable of capturing the screen, do not insist, ask for manual verification instead.

When working on Convex code, always read
`convex/_generated/ai/guidelines.md` first for important guidelines on
how to correctly use Convex APIs and patterns

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
