import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../users/queries";

export const createInfraContainer = mutation({
	args: {
		nodeId: v.id("nodes"),
		templateId: v.id("infraTemplates"),
		containerName: v.string(),
		composeYaml: v.string(),
		postInstall: v.optional(v.array(v.object({
			name: v.string(),
			service: v.string(),
			command: v.string(),
		}))),
		healthCheck: v.optional(v.object({
			service: v.string(),
			command: v.string(),
		})),
		configFileName: v.optional(v.string()),
		config: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) throw new Error("Unauthorized");

		const node = await ctx.db.get(args.nodeId);
		if (!node || node.userId !== user._id) throw new Error("Forbidden");

		return await ctx.db.insert("infraContainers", {
			ownerId: user._id,
			nodeId: args.nodeId,
			templateId: args.templateId,
			containerName: args.containerName,
			composeYaml: args.composeYaml,
			postInstall: args.postInstall,
			healthCheck: args.healthCheck,
			configFileName: args.configFileName,
			config: args.config,
		});
	}
});

export const createInfraEnvironment = mutation({
	args: { id: v.id("infraContainers") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) throw new Error("Unauthorized");

		const container = await ctx.db.get(args.id);
		if (!container || container.ownerId !== user._id) throw new Error("Forbidden");

		return await ctx.db.insert("infraEnvironments", {
			infraId: args.id,
		});
	}
});
