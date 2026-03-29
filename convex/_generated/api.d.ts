/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as blogPosts from "../blogPosts.js";
import type * as projectImages from "../projectImages.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as siteContent from "../siteContent.js";
import type * as socialLinks from "../socialLinks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  blogPosts: typeof blogPosts;
  projectImages: typeof projectImages;
  projects: typeof projects;
  seed: typeof seed;
  siteContent: typeof siteContent;
  socialLinks: typeof socialLinks;
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
