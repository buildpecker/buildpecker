import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action, httpAction } from "../_generated/server"
import { removeDnsCname, removeIngressRule } from "../lib/cfTunnel";

export const deleteProject = action({
	args: { id: v.id("projects") },
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const project = await ctx.runQuery(api.projects.queries.getProjectById, { id: args.id });
		if (!project) throw new Error("Project not found");
		if (project.ownerId !== user._id) throw new Error("Forbidden");

		const deps = await ctx.runQuery(api.deployments.queries.getDeploymentsByProject, { projectId: args.id });

		const seenIngress = new Set<string>();
		for (const dep of deps) {
			if (!dep.publicUrl) continue;
			const key = `${dep.nodeId}:${dep.publicUrl}`;
			if (seenIngress.has(key)) continue;
			seenIngress.add(key);
			try {
				const node = await ctx.runQuery(api.nodes.queries.getNodeById, { id: dep.nodeId });
				if (node?.cloudflareTunnelId) {
					await removeIngressRule(node.cloudflareTunnelId, dep.publicUrl);
				}
			} catch (err) {
				console.error("cloudflare ingress cleanup failed", err);
			}
		}

		const hosts = new Set(deps.map(d => d.publicUrl).filter((h): h is string => Boolean(h)));
		for (const host of hosts) {
			try {
				await removeDnsCname(host);
			} catch (err) {
				console.error("cloudflare dns cleanup failed", err);
			}
		}

		await ctx.runMutation(internal.projects.mutations.cascadeDeleteProject, { id: args.id });
	}
});

// TODO: Fix object level authorization
export const setProjectFrameworkAction = httpAction(async (ctx, req) => {
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
	const { id, framework } = body;

	await ctx.runMutation(internal.projects.mutations.updateProjectFramework, {
		id: id, framework: framework
	})

	return new Response(null, { status: 200 });
})
