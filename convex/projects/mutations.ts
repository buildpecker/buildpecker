import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";

export const createProject = mutation({
	args: {
		name: v.string(),
		ownerId: v.id("users"),
		defaultBranch: v.string(),
		repoUrl: v.string(),
		framework: v.string()
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert("projects", {
			name: args.name,
			ownerId: args.ownerId,
			framework: args.framework,
			defaultBranch: "main",
			repoUrl: args.repoUrl,
			buildCommand: "",
			startCommand: ""
		});

		return id;
	}
});

export const updateProjectFramework = internalMutation({
	args: {
		id: v.id("projects"),
		framework: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch("projects", args.id, { framework: args.framework })
	}
})
