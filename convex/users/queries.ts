import { query, QueryCtx } from "../_generated/server";
import { v } from "convex/values";

export const findOneByAuthToken = query({
	args: { authToken: v.string() },
	handler: async (ctx, args) => {
		const results = await ctx.db
			.query("users")
			.withIndex("by_authToken", (q) => q.eq("authToken", args.authToken))
			.collect();

		if (results.length !== 1) throw new Error(`Expected exactly 1 item, but received ${results.length} items`);

		return results[0];
	}
})

export const current = query({
	args: {},
	handler: async (ctx) => {
		return await getCurrentUser(ctx);
	},
});

export async function getCurrentUser(ctx: QueryCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		return null;
	}
	return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
	return await ctx.db
		.query("users")
		.withIndex("by_externalId", (q) => q.eq("externalId", externalId))
		.unique();
}
