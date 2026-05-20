import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const setLastHearbeatTime = internalMutation({
	args: { time: v.number(), nodeId: v.id("nodes") },
	handler: async (ctx, args) => {
		return await ctx.db.patch("nodes", args.nodeId, { lastHeartbeat: args.time })
	}
})

export const insertNode = internalMutation({
	args: {
		userId: v.id("users"),
		tokenHash: v.string(),
		name: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
		cloudflareTunnelId: v.string(),
		cloudflareTunnelToken: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("nodes", { ...args, lastHeartbeat: Date.now() });
	}
});

export const purgeNode = internalMutation({
	args: {
		nodeId: v.id("nodes"),
	},
	handler: async (ctx, args) => {
		const deps = await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.nodeId))
			.collect();
		for (const d of deps) {
			await ctx.db.delete("deployments", d._id);
		}
		await ctx.db.delete("nodes", args.nodeId);
	}
});
