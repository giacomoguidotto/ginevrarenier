const DSN_RE = /^https?:\/\/([^@]+)@([^/]+)\/(.+)$/;

export async function captureException(
  error: unknown,
  context?: { action: string; [key: string]: unknown }
): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const match = dsn.match(DSN_RE);
  if (!match) {
    return;
  }

  const [, publicKey, host, projectId] = match;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = new Date().toISOString();

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.constructor.name : "Error";

  const event = {
    event_id: eventId,
    timestamp,
    platform: "node",
    server_name: "convex",
    environment: process.env.CONVEX_CLOUD_URL?.includes("prod")
      ? "production"
      : "preview",
    tags: {
      runtime: "convex",
      ...(context?.action ? { action: context.action } : {}),
    },
    extra: context,
    exception: {
      values: [
        {
          type: errorType,
          value: errorMessage,
          ...(error instanceof Error && error.stack
            ? {
                stacktrace: {
                  frames: error.stack
                    .split("\n")
                    .slice(1)
                    .map((line: string) => ({ value: line.trim() })),
                },
              }
            : {}),
        },
      ],
    },
  };

  const header = JSON.stringify({
    event_id: eventId,
    dsn,
    sent_at: timestamp,
  });
  const itemHeader = JSON.stringify({
    type: "event",
    content_type: "application/json",
  });
  const body = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

  try {
    await fetch(`https://${host}/api/${projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body,
    });
  } catch {
    // Monitoring should never break the app
  }
}
