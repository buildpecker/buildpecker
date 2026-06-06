import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getEnvByProjectId = internalQuery({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const res = await ctx.db.query("environments")
			.withIndex("by_projectId", q => q.eq("projectId", args.projectId))
			.unique();

		return res?._id;
	}
})

export const getEnvByInfraId = internalQuery({
	args: {
		infraId: v.id("infraContainers"),
	},
	handler: async (ctx, args) => {
		const res = await ctx.db.query("infraEnvironments")
			.withIndex("by_infraId", q => q.eq("infraId", args.infraId))
			.unique();

		return res?._id;
	}
})
