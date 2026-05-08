/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as deployments_actions from "../deployments/actions.js";
import type * as deployments_mutations from "../deployments/mutations.js";
import type * as deployments_queries from "../deployments/queries.js";
import type * as github_queries from "../github/queries.js";
import type * as http from "../http.js";
import type * as lib_redis from "../lib/redis.js";
import type * as nodes_actions from "../nodes/actions.js";
import type * as nodes_mutations from "../nodes/mutations.js";
import type * as nodes_nodejs_actions from "../nodes/nodejs/actions.js";
import type * as nodes_queries from "../nodes/queries.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "deployments/actions": typeof deployments_actions;
  "deployments/mutations": typeof deployments_mutations;
  "deployments/queries": typeof deployments_queries;
  "github/queries": typeof github_queries;
  http: typeof http;
  "lib/redis": typeof lib_redis;
  "nodes/actions": typeof nodes_actions;
  "nodes/mutations": typeof nodes_mutations;
  "nodes/nodejs/actions": typeof nodes_nodejs_actions;
  "nodes/queries": typeof nodes_queries;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
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
