import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const proxy = createMiddleware(routing);

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
