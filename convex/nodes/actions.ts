import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action, httpAction } from "../_generated/server";
import { deleteTunnel, deleteDnsByTunnel } from "../lib/cfTunnel";

export const deleteNodeFromDashboard = action({
	args: { id: v.id("nodes") },
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const node = await ctx.runQuery(api.nodes.queries.getNodeById, { id: args.id });
		if (!node) throw new Error("Node not found");
		if (node.userId !== user._id) throw new Error("Forbidden");

		try {
			await deleteTunnel(node.cloudflareTunnelId);
			await deleteDnsByTunnel(node.cloudflareTunnelId);
		} catch (err) {
			console.error("cloudflare cleanup failed during node delete", err);
		}

		await ctx.runMutation(internal.nodes.mutations.purgeNode, { nodeId: node._id });
	}
});

export const deleteNode = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		console.warn("delete-node from unknown/stale node token; nothing to delete");
		return new Response(null, { status: 200 });
	}

	try {
		await deleteTunnel(node.cloudflareTunnelId);
		await deleteDnsByTunnel(node.cloudflareTunnelId);
	} catch (err) {
		console.error("cloudflare cleanup failed during node delete", err);
	}

	await ctx.runMutation(internal.nodes.mutations.purgeNode, {
		nodeId: node._id
	});

	return new Response(null, { status: 200 });
});

export const setHeartbeatAction = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		console.warn("heartbeat from unknown/stale node token; ignoring");
		return new Response(null, { status: 200 });
	}

	await ctx.runMutation(internal.nodes.mutations.setLastHearbeatTime, {
		time: Date.now(),
		nodeId: node._id
	});

	return new Response(null, { status: 200 });
})
