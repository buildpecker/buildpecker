import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const getQueuedDeploymentsAction = httpAction(async (ctx, req) => {

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

	const body = await req.json();
	const { id } = body;

	let deployments = await ctx.runQuery(internal.deployments.queries.getQueuedDeployments, { id: id });

	return new Response(JSON.stringify(deployments), { status: 200 });
})

export const setDeploymentStatusAction = httpAction(async (ctx, req) => {
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

	const body = await req.json();
	const { id, status: depStatus } = body;

	await ctx.runMutation(internal.deployments.mutations.setDeploymentStatus, {
		id: id,
		nodeId: node._id,
		status: depStatus
	});

	return new Response(null, { status: 200 });
})
