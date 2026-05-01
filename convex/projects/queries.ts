import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAllProjectsForUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.query("projects")
			.withIndex("by_ownerId", p => p.eq("ownerId", args.userId))
			.collect();
	}
});
