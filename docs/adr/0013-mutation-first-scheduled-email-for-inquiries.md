# Mutation-First Scheduled Email for Inquiries

The Connect page contact form needs to send an email to the artist when a visitor submits an inquiry. The straightforward approach — call the Resend API directly from a Convex action — risks losing inquiries: if the API call fails or times out, the visitor's message is gone. Every inquiry potentially represents a job offer, so zero data loss is the hard requirement.

## Decision

Split submission into two steps: a **synchronous mutation** that persists the inquiry to an `inquiries` table, followed by a **scheduled action** that sends the email via Resend.

1. The form calls a Convex mutation. The mutation validates the input, writes the inquiry record (with `emailStatus: "pending"`), and calls `ctx.scheduler.runAfter` to schedule the email-sending action.
2. The scheduled action calls the Resend API. On success it patches `emailStatus` to `"sent"`. On failure it reschedules itself with exponential backoff, up to 3 attempts. After exhausting retries it patches `emailStatus` to `"failed"`.
3. The visitor always sees a success confirmation after step 1. Email delivery is an internal concern.

The Convex dashboard serves as the escape hatch — the artist can filter by `emailStatus: "failed"` if they suspect a lost notification.

## Consequences

- No inquiry is lost regardless of Resend availability. The database is the source of truth, not the email.
- The visitor's confirmation is instantaneous (mutation, not action) and never blocked by a slow third-party API.
- No admin UI is needed for viewing inquiries — the Convex dashboard covers the rare failure case. This avoids pulling Inquiry into the Entity/Draft Buffer system.
- Adds a table and a scheduled action pattern that didn't exist before, but the operational surface is small (write-once records, no CRUD).
