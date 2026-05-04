import { v } from "convex/values";
import { mutation } from "../_generated/server";

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
