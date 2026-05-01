"use node"

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import redis from "../lib/redis";

export const createRegistrationToken = action({
	args: {},
	handler: async (ctx): Promise<string> => {
		const user = await ctx.runQuery(api.users.mutations.current, {});
		if (!user) throw new Error("User not found");

		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const token = Array.from(bytes)
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");

		await redis.set(token, user._id, "EX", 10 * 60, "NX");

		return token;
	}
});

export const registerNode = action({
	args: {
		token: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
	},
	handler: async (ctx, args): Promise<{ nodeId: Id<"nodes">; nodeToken: string }> => {
		const userId = await redis.get(args.token) as Id<"users"> | null;
		if (!userId) throw new Error("Invalid or expired token");

		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const nodeToken = Array.from(bytes)
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");

		const idx = Math.floor(Math.random() * 5000);

		const nodeId: Id<"nodes"> = await ctx.runMutation(internal.nodes.mutations.insertNode, {
			userId,
			token: nodeToken,
			name: `Node ${idx}`,
			cpuCores: args.cpuCores,
			memoryMb: args.memoryMb,
			diskMb: args.diskMb,
			hostname: args.hostname,
		});

		await redis.del(args.token);

		return { nodeId, nodeToken };
	}
});
