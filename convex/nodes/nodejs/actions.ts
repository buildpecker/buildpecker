"use node"

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import redis from "../../lib/redis";
import { deleteTunnel, deleteDnsByTunnel } from "../../lib/cfTunnel";
import { hash } from "node:crypto";

export const createRegistrationToken = action({
	args: {},
	handler: async (ctx): Promise<string> => {
		const user = await ctx.runQuery(api.users.queries.current, {});
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
	handler: async (ctx, args): Promise<{ nodeId: Id<"nodes">; nodeToken: string, userId: Id<"users">, cloudflareTunnelId: string, cloudflareTunnelToken: string }> => {
		const userId = await redis.get(args.token) as Id<"users"> | null;
		if (!userId) throw new Error("Invalid or expired token");

		const staleNodes = await ctx.runQuery(internal.nodes.queries.getNodesByUserHostname, {
			userId,
			hostname: args.hostname,
		});

		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const nodeToken = Array.from(bytes)
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");

		const tokenHash = hash('sha256', nodeToken)

		const idx = Math.floor(Math.random() * 5000);

		//cloudflare create tunnel for new node
		const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID!}/cfd_tunnel`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN!}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				"name": `${nodeToken}-forgetunnel`,
				"config_src": "cloudflare"
			})
		});

		if (!cfRes.ok) throw new Error(`Cloudflare tunnel create failed: ${await cfRes.text()}`);
		const cfResJson = await cfRes.json();
		if (!cfResJson.success || !cfResJson.result) {
			throw new Error(`Cloudflare tunnel create failed: ${JSON.stringify(cfResJson.errors ?? cfResJson)}`);
		}
		const id = cfResJson.result.id as string;
		const token = cfResJson.result.token as string;

		const nodeId: Id<"nodes"> = await ctx.runMutation(internal.nodes.mutations.insertNode, {
			userId,
			tokenHash: tokenHash,
			name: `Node ${idx}`,
			cpuCores: args.cpuCores,
			memoryMb: args.memoryMb,
			diskMb: args.diskMb,
			hostname: args.hostname,
			cloudflareTunnelId: id,
			cloudflareTunnelToken: token,
		});

		await redis.del(args.token);

		for (const old of staleNodes) {
			try {
				await deleteTunnel(old.cloudflareTunnelId);
				await deleteDnsByTunnel(old.cloudflareTunnelId);
			} catch (err) {
				console.error("cloudflare cleanup failed for stale node", old._id, err);
			}
			try {
				await ctx.runMutation(internal.nodes.mutations.purgeNode, { nodeId: old._id });
			} catch (err) {
				console.error("purge failed for stale node", old._id, err);
			}
		}

		return {
			userId, nodeId, nodeToken,
			cloudflareTunnelId: id as string,
			cloudflareTunnelToken: token as string
		};
	}
});

export const hashToken = internalAction({
	args: { token: v.string() },
	handler: (_, args) => {
		return hash("sha256", args.token);
	}
})
