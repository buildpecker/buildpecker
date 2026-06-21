import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action, httpAction } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { applyIngressRule, ensureDnsCname, removeDnsCname, removeIngressRule } from "../lib/cfTunnel";
import { generateDepName } from "../lib/generator";

const ROOT_DOMAIN = "parthajeet.xyz";

export const createDeployment = action({
	args: {
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
		branch: v.string(),
		imageUri: v.string(),
		type: v.union(v.literal("project"), v.literal("infra"))
	},
	handler: async (ctx, args): Promise<Id<"deployments">> => {
		const node = await ctx.runQuery(api.nodes.queries.getNodeById, { id: args.nodeId });
		if (!node) throw new Error("No deployable node found!");

		const project = await ctx.runQuery(api.projects.queries.getProjectById, { id: args.projectId });
		if (!project) throw new Error("Project not found");

		const owner = project.repoUrl.split("/").at(-2);
		const repo = project.repoUrl.split("/").at(-1)?.replace(".git", "");
		const commits = await (await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`)).json() as { sha: string }[];

		const lastSha = commits[0].sha;

		const tunnelId = node.cloudflareTunnelId;
		const slug = generateDepName();
		const publicUrl = `${slug}.${ROOT_DOMAIN}`;

		await ensureDnsCname(publicUrl, tunnelId);

		return await ctx.runMutation(internal.deployments.mutations.insertDeployment, {
			name: args.name,
			nodeId: args.nodeId,
			type: args.type,
			projectId: args.projectId,
			status: args.status,
			branch: args.branch,
			sha: lastSha,
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
		const ownerId = dep.project?.ownerId ?? dep.infra?.ownerId;
		if (!ownerId || ownerId !== user._id) throw new Error("Forbidden");

		if (dep.status === "processing" || dep.status === "deleting") {
			throw new Error(`Cannot delete a deployment with status ${dep.status}`);
		}

		if (dep.routes && dep.routes.length > 0) {
			for (const route of dep.routes) {
				try {
					await removeDnsCname(route.hostname);
				} catch (err) {
					console.error("cloudflare dns cleanup failed", err);
				}
				if (dep.node?.cloudflareTunnelId) {
					try {
						await removeIngressRule(dep.node.cloudflareTunnelId, route.hostname);
					} catch (err) {
						console.error("cloudflare ingress cleanup failed", err);
					}
				}
			}
		}

		if (dep.customDomainUrl) {
			await ctx.runMutation(internal.deployments.domains.setCustomDomainUrl, {
				id: args.id,
				customDomainUrl: undefined,
			});
			try {
				await ctx.runAction(internal.deployments.domains.syncCustomDomains, {});
			} catch (err) {
				console.error("caddy custom-domain sync failed", err);
			}
		}

		if (dep.publicUrl) {
			const siblings = dep.projectId
				? await ctx.runQuery(api.deployments.queries.getDeploymentsByProject, {
					projectId: dep.projectId,
				})
				: [];
			const stillUsingUrl = siblings.some(
				s => s._id !== dep._id && s.publicUrl === dep.publicUrl && s.status !== "deleting",
			);
			if (!stillUsingUrl) {
				try {
					await removeDnsCname(dep.publicUrl);
				} catch (err) {
					console.error("cloudflare dns cleanup failed", err);
				}
				if (dep.node?.cloudflareTunnelId) {
					try {
						await removeIngressRule(dep.node.cloudflareTunnelId, dep.publicUrl);
					} catch (err) {
						console.error("cloudflare ingress cleanup failed", err);
					}
				}
			}
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
	const { id, status: depStatus, localPort, portMap } = body;

	if (Array.isArray(portMap) && portMap.length > 0) {
		const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id });
		if (!dep || !dep.node) throw new Error("Deployment or node not found");
		if (dep.node._id !== node._id) throw new Error("Node mismatch for deployment");
		const published = new Map<number, number>(
			(portMap as { containerPort: number; publishedPort: number }[])
				.map(p => [p.containerPort, p.publishedPort]),
		);
		for (const route of dep.routes ?? []) {
			const hostPort = published.get(route.containerPort);
			if (hostPort && hostPort > 0) {
				await applyIngressRule(dep.node.cloudflareTunnelId, route.hostname, `http://localhost:${hostPort}`);
			}
		}
	} else if (typeof localPort === "number" && localPort > 0) {
		const dep = await ctx.runQuery(api.deployments.queries.getDeploymentById, { id });
		if (!dep || !dep.node) throw new Error("Deployment or node not found");
		if (dep.node._id !== node._id) throw new Error("Node mismatch for deployment");
		await applyIngressRule(dep.node.cloudflareTunnelId, dep.publicUrl, `http://localhost:${localPort}`);
	}

	await ctx.runMutation(api.deployments.mutations.setDeploymentStatus, {
		id: id,
		nodeId: node._id,
		status: depStatus
	});

	return new Response(null, { status: 200 });
})

export const setDeploymentHealthCheckAction = httpAction(async (ctx, req) => {
	const url = new URL(req.url);
	const depId: Id<"deployments"> = url.pathname.split("/").filter(Boolean).at(-1) as Id<"deployments">;
	const token = url.searchParams.get("token") ?? "";
	if (!token) {
		return new Response(null, { status: 401 });
	}
	const ok = await ctx.runMutation(internal.deployments.mutations.updateHealthTimestamp, {
		id: depId,
		token,
	});
	return new Response(null, { status: ok ? 200 : 401 });
});
