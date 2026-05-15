When implementing UI changes, start the dev server and use Playwright to take a screenshot of the result, then read the screenshot image to visually verify correctness before reporting the task as complete. Also run lint and type checking.
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
