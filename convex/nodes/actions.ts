import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const deleteNode = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		throw new Error("Invalid node");
	}

	try {
		await ctx.runMutation(internal.nodes.mutations.deleteNode, {
			nodeId: node._id
		});
	} catch (err) { throw err; }

	return new Response(null, { status: 200 });
});
