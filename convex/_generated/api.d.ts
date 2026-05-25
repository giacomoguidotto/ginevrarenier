/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as blogPosts from "../blogPosts.js";
import type * as emails_confirmationEmail from "../emails/confirmationEmail.js";
import type * as emails_inquiryEmail from "../emails/inquiryEmail.js";
import type * as emails_publishNotificationEmail from "../emails/publishNotificationEmail.js";
import type * as functions from "../functions.js";
import type * as inquiries from "../inquiries.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as notifications from "../notifications.js";
import type * as projectImages from "../projectImages.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as selectedWorks from "../selectedWorks.js";
import type * as siteContent from "../siteContent.js";
import type * as slugify from "../slugify.js";
import type * as socialLinks from "../socialLinks.js";
import type * as subscribers from "../subscribers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  blogPosts: typeof blogPosts;
  "emails/confirmationEmail": typeof emails_confirmationEmail;
  "emails/inquiryEmail": typeof emails_inquiryEmail;
  "emails/publishNotificationEmail": typeof emails_publishNotificationEmail;
  functions: typeof functions;
  inquiries: typeof inquiries;
  "lib/sentry": typeof lib_sentry;
  notifications: typeof notifications;
  projectImages: typeof projectImages;
  projects: typeof projects;
  seed: typeof seed;
  selectedWorks: typeof selectedWorks;
  siteContent: typeof siteContent;
  slugify: typeof slugify;
  socialLinks: typeof socialLinks;
  subscribers: typeof subscribers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
