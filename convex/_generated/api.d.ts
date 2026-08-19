/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as age from "../age.js";
import type * as calls from "../calls.js";
import type * as connections from "../connections.js";
import type * as credits from "../credits.js";
import type * as messages from "../messages.js";
import type * as parties from "../parties.js";
import type * as profiles from "../profiles.js";
import type * as requests from "../requests.js";
import type * as safety from "../safety.js";
import type * as util from "../util.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  age: typeof age;
  calls: typeof calls;
  connections: typeof connections;
  credits: typeof credits;
  messages: typeof messages;
  parties: typeof parties;
  profiles: typeof profiles;
  requests: typeof requests;
  safety: typeof safety;
  util: typeof util;
  waitlist: typeof waitlist;
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
