import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createDeployment = mutation({
	args: {
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		branch: v.string(),
		sha: v.string(),
		imageUri: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("deployments", {
			name: args.name,
			nodeId: args.nodeId,
			projectId: args.projectId,
			branch: args.branch,
			sha: args.sha,
			imageUri: args.imageUri
		})
	}
});
