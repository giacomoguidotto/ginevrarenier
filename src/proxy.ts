import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const authMiddleware = clerkConfigured
  ? clerkMiddleware((_auth, req) => intlMiddleware(req))
  : null;

export function proxy(request: Parameters<typeof intlMiddleware>[0]) {
  if (authMiddleware) {
    // biome-ignore lint/suspicious/noExplicitAny: NextFetchEvent stub for proxy entry
    return authMiddleware(request, {} as any);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /images, /fonts (static files)
    // - files with extensions (e.g. favicon.ico)
    "/((?!_next|_vercel|images|fonts|.*\\..*).*)",
    // Always run for API routes (needed for Clerk auth)
    "/(api)(.*)",
  ],
};
