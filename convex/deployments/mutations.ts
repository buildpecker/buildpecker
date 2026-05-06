import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";

export const createDeployment = mutation({
	args: {
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
		branch: v.string(),
		sha: v.string(),
		imageUri: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("deployments", {
			name: args.name,
			nodeId: args.nodeId,
			projectId: args.projectId,
			status: args.status,
			branch: args.branch,
			sha: args.sha,
			imageUri: args.imageUri
		})
	}
});

export const setDeploymentStatus = internalMutation({
	args: {
		nodeId: v.id("nodes"),
		id: v.id("deployments"),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
	},
	handler: async (ctx, args) => {
		const row = await ctx.db.get("deployments", args.id);

		if (!row || row.nodeId !== args.nodeId)
			throw new Error(`No deployment with node id ${args.nodeId} and id ${args.id}`);

		ctx.db.patch("deployments", row._id, { "status": args.status })
	}
})
