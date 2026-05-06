import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

export const getAllNodesForUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.query("nodes")
			.withIndex("by_userId", n => n.eq("userId", args.userId))
			.collect();
	}
});

export const getNodeByNodeToken = internalQuery({
	args: { tokenHash: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db.query("nodes")
			.withIndex("by_tokenHash", t => t.eq("tokenHash", args.tokenHash))
			.unique();
	}
})
