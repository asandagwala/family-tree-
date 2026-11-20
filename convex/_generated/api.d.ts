/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as album from "../album.js";
import type * as assistant from "../assistant.js";
import type * as auth from "../auth.js";
import type * as devTools from "../devTools.js";
import type * as families from "../families.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_assistantPrompt from "../lib/assistantPrompt.js";
import type * as lib_familyCodes from "../lib/familyCodes.js";
import type * as lib_people from "../lib/people.js";
import type * as lib_sampleFamily from "../lib/sampleFamily.js";
import type * as lib_security from "../lib/security.js";
import type * as lib_tree from "../lib/tree.js";
import type * as migrations from "../migrations.js";
import type * as people from "../people.js";
import type * as photos from "../photos.js";
import type * as sample from "../sample.js";
import type * as tree from "../tree.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  album: typeof album;
  assistant: typeof assistant;
  auth: typeof auth;
  devTools: typeof devTools;
  families: typeof families;
  "lib/access": typeof lib_access;
  "lib/assistantPrompt": typeof lib_assistantPrompt;
  "lib/familyCodes": typeof lib_familyCodes;
  "lib/people": typeof lib_people;
  "lib/sampleFamily": typeof lib_sampleFamily;
  "lib/security": typeof lib_security;
  "lib/tree": typeof lib_tree;
  migrations: typeof migrations;
  people: typeof people;
  photos: typeof photos;
  sample: typeof sample;
  tree: typeof tree;
  users: typeof users;
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

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authGoogle: import("@convex-dev/auth/components/google/_generated/component.js").ComponentApi<"authGoogle">;
  authEmail: import("@convex-dev/auth/components/email/_generated/component.js").ComponentApi<"authEmail">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
