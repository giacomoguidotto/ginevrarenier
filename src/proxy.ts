import type { NextFetchEvent, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (clerkConfigured) {
    // Dynamically import Clerk to avoid errors when env vars are missing
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    const clerk = clerkMiddleware((_auth, req) => intlMiddleware(req));
    return clerk(request, event);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api routes
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /images, /fonts (static files)
    // - files with extensions (e.g. favicon.ico)
    "/((?!api|_next|_vercel|images|fonts|.*\\..*).*)",
  ],
};
