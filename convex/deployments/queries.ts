import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getQueuedDeployments = internalQuery({
	args: {
		id: v.id("nodes")
	},
	handler: async (ctx, args) => {
		const rows = await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.id))
			.collect();

		const queued = rows.filter(q => q.status === "queued");

		return queued;
	}
})
