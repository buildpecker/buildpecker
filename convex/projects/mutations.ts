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

export const cascadeDeleteProject = internalMutation({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const env = await ctx.db.query("environments")
			.withIndex("by_projectId", q => q.eq("projectId", args.id))
			.unique();
		if (env) {
			const secrets = await ctx.db.query("secrets")
				.withIndex("by_envId", q => q.eq("environmentId", env._id))
				.collect();
			for (const s of secrets) {
				await ctx.db.delete("secrets", s._id);
			}
			await ctx.db.delete("environments", env._id);
		}

		const deps = await ctx.db.query("deployments")
			.withIndex("by_projectId", q => q.eq("projectId", args.id))
			.collect();
		for (const d of deps) {
			await ctx.db.delete("deployments", d._id);
		}

		await ctx.db.delete("projects", args.id);
	}
})
