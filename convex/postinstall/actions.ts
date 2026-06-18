import { internal } from "../_generated/api";
import { ActionCtx, httpAction } from "../_generated/server";

async function authenticateNode(ctx: ActionCtx, req: Request) {
	const authHeader = req.headers.get("Authorization");
	const nodeToken = authHeader?.split(" ")[1] ?? "";
	if (!nodeToken) throw new Error("Unauthorized - No node token");

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });
	return await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash });
}

export const getQueuedPostInstallAction = httpAction(async (ctx, req) => {
	const node = await authenticateNode(ctx, req);
	if (!node) {
		console.warn("postinstall poll from unknown/stale node token");
		return new Response(JSON.stringify([]), { status: 200 });
	}

	const runs = await ctx.runQuery(internal.postinstall.queries.getQueuedRuns, { id: node._id });

	for (const run of runs) {
		await ctx.runMutation(internal.postinstall.mutations.markRunRunning, { id: run._id });
	}

	return new Response(JSON.stringify(runs), { status: 200 });
});

export const setPostInstallResultAction = httpAction(async (ctx, req) => {
	const node = await authenticateNode(ctx, req);
	if (!node) {
		return new Response(JSON.stringify({ error: "invalid node" }), { status: 401 });
	}

	const body = await req.json();
	const { id, output, exitCode } = body;

	await ctx.runMutation(internal.postinstall.mutations.completePostInstallRun, {
		id,
		output: typeof output === "string" ? output : "",
		exitCode: typeof exitCode === "number" ? exitCode : 1,
	});

	return new Response(null, { status: 200 });
});
