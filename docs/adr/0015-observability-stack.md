# Observability Stack

The site had only passive Vercel Web Analytics — no error tracking, no performance monitoring, no custom event tracking, and no alerting on email delivery failures. The inquiry email pipeline (ADR-0013), the new subscriber confirmation flow, and the publish notification system all use scheduled Convex actions that can fail silently.

## Decision

Layer four complementary tools, each owning a distinct concern, rather than adopting a unified tracing framework (e.g., Effect.js + OpenTelemetry → Axiom).

### What ships

1. **Vercel Web Analytics** (already present) — page views, referrers, top pages. Add `track()` custom events for the subscribe funnel (`subscribe` with `placement` property, `subscription_confirmed`) and inquiry submission.
2. **Vercel Speed Insights** (new) — Core Web Vitals (LCP, CLS, INP, TTFB) per page. Critical for image-heavy Project galleries.
3. **Sentry** (new, free tier) — Next.js SDK for automatic error capture on the frontend and API routes. Proactive email alerts on unhandled errors. No blanket Convex instrumentation.
4. **Sentry in three Convex actions only** — manual `try/catch` + `Sentry.captureException()` in the inquiry email action (`inquiries.ts`), the confirmation email action (`subscribers.ts`), and the publish notification action (`notifications.ts`). These are the only paths where a failure is invisible to both the Admin and the visitor/subscriber.
5. **Convex Dashboard** (existing) — function invocation metrics, latency, error logs, scheduler history. Remains the primary backend observability tool.

### Rejected alternative: Effect.js + OpenTelemetry

Convex functions run in Convex's managed cloud runtime, not a user-controlled Node.js process. This makes Effect.js + OTel fundamentally mismatched:

- No runtime control to initialize OTel SDK or attach collectors.
- No HTTP layer between client and Convex to propagate W3C trace-context headers.
- Convex's restricted runtime does not support arbitrary Node.js modules.
- Rewriting ~2,500 lines of straightforward CRUD functions into Effect layers would triple the code for no observability gain the Convex Dashboard doesn't already provide.

### Why only three Convex actions get Sentry

Convex Dashboard already surfaces function errors with stack traces, invocation counts, and latency. Adding Sentry to every function would duplicate this and add boilerplate. The three email-sending actions are special: their failures are invisible to end users (the visitor sees a success message, the subscriber sees nothing), and the Admin has no in-app signal that delivery failed. Sentry's alerting closes that gap.

## Consequences

- Two dashboards (Vercel, Convex) plus Sentry alerts cover all four monitoring concerns: behavioral analytics, performance, error tracking, and operational reliability.
- The subscribe funnel becomes measurable — which placement (home, footer, connect) converts best.
- Email delivery failures trigger Sentry alerts rather than sitting silently in Convex logs.
- Sentry's free tier (5K errors/month, 1 user) is sufficient for a single-Admin portfolio site.
- No new domain terms are introduced — observability is an infrastructure concern, not a domain concept.
