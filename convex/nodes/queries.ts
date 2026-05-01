import { v } from "convex/values";
import { query } from "../_generated/server";

export const getAllNodesForUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.query("nodes")
			.withIndex("by_userId", n => n.eq("userId", args.userId))
			.collect();
	}
});
