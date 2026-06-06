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
import type * as environments_actions from "../environments/actions.js";
import type * as environments_mutations from "../environments/mutations.js";
import type * as environments_nodejs_actions from "../environments/nodejs/actions.js";
import type * as environments_queries from "../environments/queries.js";
import type * as http from "../http.js";
import type * as infra_actions from "../infra/actions.js";
import type * as infra_mutations from "../infra/mutations.js";
import type * as infra_queries from "../infra/queries.js";
import type * as lib_cfTunnel from "../lib/cfTunnel.js";
import type * as lib_redis from "../lib/redis.js";
import type * as nodes_actions from "../nodes/actions.js";
import type * as nodes_metricsActions from "../nodes/metricsActions.js";
import type * as nodes_mutations from "../nodes/mutations.js";
import type * as nodes_nodejs_actions from "../nodes/nodejs/actions.js";
import type * as nodes_queries from "../nodes/queries.js";
import type * as projects_actions from "../projects/actions.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as secrets_mutations from "../secrets/mutations.js";
import type * as secrets_queries from "../secrets/queries.js";
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
  "environments/actions": typeof environments_actions;
  "environments/mutations": typeof environments_mutations;
  "environments/nodejs/actions": typeof environments_nodejs_actions;
  "environments/queries": typeof environments_queries;
  http: typeof http;
  "infra/actions": typeof infra_actions;
  "infra/mutations": typeof infra_mutations;
  "infra/queries": typeof infra_queries;
  "lib/cfTunnel": typeof lib_cfTunnel;
  "lib/redis": typeof lib_redis;
  "nodes/actions": typeof nodes_actions;
  "nodes/metricsActions": typeof nodes_metricsActions;
  "nodes/mutations": typeof nodes_mutations;
  "nodes/nodejs/actions": typeof nodes_nodejs_actions;
  "nodes/queries": typeof nodes_queries;
  "projects/actions": typeof projects_actions;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "secrets/mutations": typeof secrets_mutations;
  "secrets/queries": typeof secrets_queries;
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
