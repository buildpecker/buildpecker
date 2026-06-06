import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getCurrentUser } from "../users/queries";

export const insertDeployment = internalMutation({
	args: {
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.optional(v.id("projects")),
		infraId: v.optional(v.id("infraContainers")),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
		branch: v.string(),
		sha: v.string(),
		imageUri: v.string(),
		publicUrl: v.string(),
		type: v.union(v.literal("project"), v.literal("infra")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("deployments", {
			name: args.name,
			type: args.type,
			nodeId: args.nodeId,
			projectId: args.projectId,
			infraId: args.infraId,
			status: args.status,
			branch: args.branch,
			sha: args.sha,
			imageUri: args.imageUri,
			publicUrl: args.publicUrl
		})
	}
});

export const setDeploymentStatus = mutation({
	args: {
		nodeId: v.id("nodes"),
		id: v.id("deployments"),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
	},
	handler: async (ctx, args) => {
		const row = await ctx.db.get("deployments", args.id);

		if (!row || row.nodeId !== args.nodeId)
			throw new Error(`No deployment with node id ${args.nodeId} and id ${args.id}`);

		ctx.db.patch("deployments", row._id, { "status": args.status })
	}
})

export const cancelQueuedDeployment = mutation({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) throw new Error("Unauthorized");

		const dep = await ctx.db.get(args.id);
		if (!dep) throw new Error("Deployment not found");

		const ownerId = dep.projectId
			? (await ctx.db.get(dep.projectId))?.ownerId
			: dep.infraId
				? (await ctx.db.get(dep.infraId))?.ownerId
				: undefined;
		if (!ownerId) throw new Error("Deployment owner not found");
		if (ownerId !== user._id) throw new Error("Forbidden");

		if (dep.status !== "queued") {
			throw new Error(`Can only cancel queued deployments, got ${dep.status}`);
		}

		await ctx.db.patch(args.id, { status: "cancelled" });
	}
});

export const markDeleting = internalMutation({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { status: "deleting" });
	}
});

export const purgeDeployment = internalMutation({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	}
});
