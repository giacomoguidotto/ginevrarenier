# Automated Subscriber Notifications on Publish

The site had no mechanism to retain visitors after they leave. The inquiry form on `/connect` serves one-off contact but offers no ongoing relationship. Once a visitor leaves, there is no channel to surface new work to them.

## Decision

Add a subscription system triggered by Project publication, with double opt-in and GDPR-compliant consent.

### Trigger and content

Emails are sent automatically when a Project transitions to `published`. The email contains the new project as primary content (teaser image, title, description) and a secondary section listing the most recent published blog posts. No manual composition is required — the trigger is the publish action itself.

Alternative considered: manual newsletter sends (maximum creative freedom, but requires ongoing effort and risks going dormant). Rejected because the automated trigger guarantees the channel stays alive as long as the artist publishes work, with zero additional overhead.

Alternative considered: triggering on both Project and Post publish. Rejected because blog posts are secondary content and frequent triggers would dilute the signal. Posts are included passively in the email body instead.

### Opt-in flow

Double opt-in: visitor submits email → receives confirmation email → clicks link → stored as active subscriber. The confirmation email is warm and first-person, matching the portfolio's intimate tone, sent in the locale inferred from the page route at signup time.

A GDPR consent line appears below the form input (hardcoded in translation files, not admin-editable) stating the scope and frequency of emails and the right to unsubscribe.

### Data model

A `subscribers` table in Convex: email, locale (inferred), status (`pending` | `confirmed` | `unsubscribed`), consent timestamp, confirmation token. Emails are the unique key.

### Placements

The signup form appears in three locations with contextually distinct editable copy (each a separate Field in `siteContent`):

1. End of the Featured Work section on the homepage
2. Footer brand column
3. `/connect` page

The creative prompt text above the input is admin-editable; the legal consent line is not.

### Email infrastructure

Reuses the existing Resend integration (ADR #13). Adds a second email template for the publish notification and a confirmation email template. The publish trigger is a scheduled action kicked off by the project publish mutation, iterating over confirmed subscribers.

## Consequences

- Visitors who enjoy the work can maintain a connection without relying on social media algorithms or bookmarks.
- The artist takes on no ongoing composition burden — publishing a project is the only action required.
- A new Convex table (`subscribers`) and two new email templates are added to the system.
- The double opt-in flow means some subscribers will never confirm, reducing list size but improving deliverability and compliance.
- Every email must include an unsubscribe link that transitions the subscriber to `unsubscribed` status.
- The publish mutation gains a side effect (scheduling notification emails), coupling content publishing to the email system. This is acceptable because the coupling is intentional and the scheduled action is fire-and-forget with retry semantics matching ADR #13.
