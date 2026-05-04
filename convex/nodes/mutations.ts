import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

export const insertNode = internalMutation({
	args: {
		userId: v.id("users"),
		tokenHash: v.string(),
		name: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("nodes", args);
	}
});

export const deleteNode = internalMutation({
	args: {
		nodeId: v.id("nodes"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.delete("nodes", args.nodeId);
	}
});
