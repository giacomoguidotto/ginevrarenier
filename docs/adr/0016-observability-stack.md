# Observability Stack

Status: Accepted

The site started with passive Vercel Web Analytics, Vercel Speed Insights, and a narrow Sentry plan for unhandled frontend/API errors plus a few silent Convex email actions. That plan no longer matches the admin editing system: failed saves need graceful UX, Sentry correlation, and alert priority without spending beyond free tiers.

## Decision

Use **Sentry as the central error inbox** and route admin failures through explicit classification rather than treating every failed operation as an unhandled exception. Expected failures stay local; unexpected failures are captured in Sentry with tags, context, Convex request IDs, and notification-visible Sentry event IDs. Learn Effect in a narrow admin-operation runtime first, and introduce OpenTelemetry later only as an instrumentation model/lab after Sentry classification is clean.

### What ships

1. **Sentry** — primary operational inbox for production errors, handled unexpected admin failures, issue grouping, release/source-map debugging, replays, traces, and email alerts.
2. **Admin failure classification** — admin operations classify failures before reporting:
   - `expected_auth_denial`: show local session/auth UI, do not capture in Sentry.
   - `expected_validation`: show local validation UI, do not capture by default.
   - `unexpected_admin_failure`: capture in Sentry as an error and notify the Admin with both Convex request ID and Sentry event ID when available.
   - `data_integrity_risk`: capture in Sentry with higher priority tags and alerting.
3. **Sentry alert rules** — email on production events tagged with actionable failure classes such as `area:admin` and `admin.failure_kind:unexpected_admin_failure`, rather than relying on the generic "Unhandled" badge.
4. **Effect island** — Effect may be introduced at the admin-operation runtime seam to model typed failure classes, reporting policy, and spans. React components and Convex mutations stay plain at their edges.
5. **OpenTelemetry later** — OTel is a learning target and future instrumentation model, not the first implementation step. Do not add a collector or second observability backend until Sentry classification and alerts are solid.
6. **Vercel Web Analytics and Speed Insights** — remain product/performance analytics, not the incident inbox.
7. **Convex Dashboard** — remains the backend request log and request-ID lookup surface on the free plan.

### Budget constraint

This project should fly on $0 services as long as possible. That means no Vercel Drains and no paid Convex exception-reporting/log-streaming pipeline. Convex request IDs are the bridge from Sentry events to Convex dashboard logs.

### Rejected alternative: force handled admin failures to look unhandled

Admin save/discard/create/upload failures should not be made crash-shaped just to trigger generic alerts. The UI intentionally handles them. Sentry should still see the unexpected ones, but the signal should come from explicit classification and alert rules.

### Rejected alternative: whole-codebase Effect rewrite

Effect is valuable for learning typed errors and effectful workflows, but a blanket rewrite would hide the concrete architectural work. Use it first where it creates leverage: the admin-operation runtime that separates expected failures, unexpected failures, notification policy, and Sentry reporting.

## Consequences

- Sentry becomes the place to triage production failures, even when the UI handles them gracefully.
- Expected auth/session failures do not burn Sentry quota or trigger noisy email.
- Every actionable admin failure should be searchable by `admin.failure_kind`, `admin.operation`, `convex.request_id`, and Sentry event ID.
- Effect adoption has a tight seam and a clear learning purpose instead of spreading into every React component or Convex function.
- Full centralized telemetry remains intentionally limited on the free tier; Convex and Vercel stay as side dashboards until the budget changes.
- No new domain terms are introduced — observability is an infrastructure concern, not a domain concept.
