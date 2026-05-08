import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createProject = mutation({
	args: {
		name: v.string(),
		ownerId: v.id("users"),
		defaultBranch: v.string(),
		repoUrl: v.string(),
		framework: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("projects", {
			name: args.name,
			ownerId: args.ownerId,
			framework: args.framework,
			defaultBranch: "main",
			repoUrl: args.repoUrl,
			buildCommand: "",
			startCommand: ""
		});
	}
});
