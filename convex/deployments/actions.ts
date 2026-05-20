import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action, httpAction } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { applyIngressRule, ensureDnsCname } from "../lib/cfTunnel";

const ROOT_DOMAIN = "parthajeet.xyz";

function slugify(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export const createDeployment = action({
	args: {
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
		branch: v.string(),
		sha: v.string(),
		imageUri: v.string(),
	},
	handler: async (ctx, args): Promise<Id<"deployments">> => {
		const node = await ctx.runQuery(api.nodes.queries.getNodeById, { id: args.nodeId });
		if (!node) throw new Error("No deployable node found!");

		const project = await ctx.runQuery(api.projects.queries.getProjectById, { id: args.projectId });
		if (!project) throw new Error("Project not found");

		const tunnelId = node.cloudflareTunnelId;
		const slug = slugify(project.name) || args.projectId;
		const publicUrl = `${slug}.${ROOT_DOMAIN}`;

		await ensureDnsCname(publicUrl, tunnelId);

		return await ctx.runMutation(internal.deployments.mutations.insertDeployment, {
			name: args.name,
			nodeId: args.nodeId,
			projectId: args.projectId,
			status: args.status,
			branch: args.branch,
			sha: args.sha,
			imageUri: args.imageUri,
			publicUrl,
		});
	},
});

export const getPendingDeletesAction = httpAction(async (ctx, req) => {

	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });
	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		console.warn("pending-deletes poll from unknown/stale node token");
		return new Response(JSON.stringify([]), { status: 200 });
	}

	const body = await req.json();
	const { id } = body;

	const deployments = await ctx.runQuery(internal.deployments.queries.getDeletingDeployments, { id });

	return new Response(JSON.stringify(deployments), { status: 200 });
});

export const finalizeDeleteAction = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });
	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		return new Response(JSON.stringify({ error: "invalid node" }), { status: 401 });
	}

	const body = await req.json();
	const { id } = body;

	const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id });
	if (!dep || !dep.node) {
		return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
	}
	if (dep.node._id !== node._id) {
		return new Response(JSON.stringify({ error: "node mismatch" }), { status: 403 });
	}

	await ctx.runMutation(internal.deployments.mutations.purgeDeployment, { id });
	return new Response(null, { status: 200 });
});

export const getQueuedDeploymentsAction = httpAction(async (ctx, req) => {

	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		console.warn("queued poll from unknown/stale node token; node likely re-registered or purged");
		return new Response(JSON.stringify([]), { status: 200 });
	}

	const body = await req.json();
	const { id } = body;

	const deployments = await ctx.runQuery(internal.deployments.queries.getQueuedDeployments, { id: id });

	return new Response(JSON.stringify(deployments), { status: 200 });
})

export const deleteDeployment = action({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id: args.id });
		if (!dep) throw new Error("Deployment not found");
		if (!dep.project || dep.project.ownerId !== user._id) throw new Error("Forbidden");

		if (dep.status === "processing" || dep.status === "deleting") {
			throw new Error(`Cannot delete a deployment with status ${dep.status}`);
		}

		if (dep.status === "completed") {
			await ctx.runMutation(internal.deployments.mutations.markDeleting, { id: args.id });
			return;
		}

		await ctx.runMutation(internal.deployments.mutations.purgeDeployment, { id: args.id });
	}
});

export const setDeploymentStatusAction = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		console.warn("status update from unknown/stale node token; ignoring");
		return new Response(JSON.stringify({ error: "invalid node" }), { status: 401 });
	}

	const body = await req.json();
	const { id, status: depStatus, localPort } = body;

	if (typeof localPort === "number" && localPort > 0) {
		const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id });
		if (!dep || !dep.node) throw new Error("Deployment or node not found");
		if (dep.node._id !== node._id) throw new Error("Node mismatch for deployment");
		await applyIngressRule(dep.node.cloudflareTunnelId, dep.publicUrl, `http://localhost:${localPort}`);
	}

	await ctx.runMutation(internal.deployments.mutations.setDeploymentStatus, {
		id: id,
		nodeId: node._id,
		status: depStatus
	});

	return new Response(null, { status: 200 });
})
