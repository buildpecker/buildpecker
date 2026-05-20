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

export const getNodeById = query({
	args: { id: v.id("nodes") },
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getNodesByUserHostname = internalQuery({
	args: { userId: v.id("users"), hostname: v.string() },
	handler: async (ctx, args) => {
		const nodes = await ctx.db.query("nodes")
			.withIndex("by_userId", n => n.eq("userId", args.userId))
			.collect();
		return nodes.filter(n => n.hostname === args.hostname);
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
