import {
  captureRouterTransitionStart,
  init,
  replayIntegration,
} from "@sentry/nextjs";

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [replayIntegration()],
});

export const onRouterTransitionStart = captureRouterTransitionStart;
