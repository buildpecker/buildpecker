import { v } from "convex/values";
import { query } from "../_generated/server";

export const getAllInfraTemplates = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("infraTemplates").collect();
	}
});

export const getInfraTemplateById = query({
	args: { id: v.id("infraTemplates") },
	handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getInfraContainerById = query({
	args: { id: v.id("infraContainers") },
	handler: async (ctx, args) => {
		const container = await ctx.db.get(args.id);
		if (!container) return null;
		const [template, node] = await Promise.all([
			ctx.db.get(container.templateId),
			ctx.db.get(container.nodeId),
		]);
		return { ...container, template, node };
	}
});
