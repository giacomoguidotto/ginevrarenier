import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export const proxy = clerkMiddleware((_auth, request) =>
  intlMiddleware(request)
);

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
