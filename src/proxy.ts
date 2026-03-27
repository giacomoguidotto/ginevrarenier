import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const clerk = clerkMiddleware((_auth, request) => intlMiddleware(request));

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return clerk(request, event);
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
