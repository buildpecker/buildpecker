import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createInfraContainer = mutation({
	args: {
		ownerId: v.id("users"),
		nodeId: v.id("nodes"),
		templateId: v.id("infraTemplates"),
		containerName: v.string(),
		composeYaml: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("infraContainers", {
			ownerId: args.ownerId,
			nodeId: args.nodeId,
			templateId: args.templateId,
			containerName: args.containerName,
			composeYaml: args.composeYaml,
		});
	}
});

export const createInfraEnvironment = mutation({
	args: { id: v.id("infraContainers") },
	handler: async (ctx, args) => {
		return await ctx.db.insert("infraEnvironments", {
			infraId: args.id,
		});
	}
});
