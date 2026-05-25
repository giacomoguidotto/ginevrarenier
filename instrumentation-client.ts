import {
  captureRouterTransitionStart,
  init,
  replayIntegration,
} from "@sentry/nextjs";

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [replayIntegration()],
});

export const onRouterTransitionStart = captureRouterTransitionStart;
