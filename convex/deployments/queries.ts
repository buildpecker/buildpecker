import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getCurrentUser } from "../users/queries";

export const getDeploymentsByProject = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) return [];
		const project = await ctx.db.get(args.projectId);
		if (!project || project.ownerId !== user._id) return [];
		return await ctx.db.query("deployments")
			.withIndex("by_projectId", p => p.eq("projectId", args.projectId))
			.collect();
	}
});

export const getDeploymentsByNode = query({
	args: { nodeId: v.id("nodes") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) return [];
		const node = await ctx.db.get(args.nodeId);
		if (!node || node.userId !== user._id) return [];
		return await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.nodeId))
			.collect();
	}
});

export const getDeploymentById = query({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) return null;
		const dep = await ctx.db.get(args.id);
		if (!dep) return null;
		const [project, node] = await Promise.all([
			dep.projectId ? ctx.db.get(dep.projectId) : Promise.resolve(null),
			ctx.db.get(dep.nodeId),
		]);
		const container = dep.infraId ? await ctx.db.get(dep.infraId) : null;
		const ownerId = dep.projectId ? project?.ownerId : container?.ownerId;
		if (ownerId !== user._id) return null;
		const infra = container
			? { ...container, template: await ctx.db.get(container.templateId) }
			: null;
		return { ...dep, project, node, infra };
	}
});

export const getDeploymentByIdInternal = internalQuery({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		const dep = await ctx.db.get(args.id);
		if (!dep) return null;
		const [project, node] = await Promise.all([
			dep.projectId ? ctx.db.get(dep.projectId) : Promise.resolve(null),
			ctx.db.get(dep.nodeId),
		]);
		const container = dep.infraId ? await ctx.db.get(dep.infraId) : null;
		const infra = container
			? { ...container, template: await ctx.db.get(container.templateId) }
			: null;
		return { ...dep, project, node, infra };
	}
});

export const getAllDeploymentsForUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		if (!user) return [];
		const projects = await ctx.db.query("projects")
			.withIndex("by_ownerId", p => p.eq("ownerId", user._id))
			.collect();
		const projectMap = new Map(projects.map(p => [p._id, p]));

		const projectBuckets = await Promise.all(
			projects.map(p =>
				ctx.db.query("deployments")
					.withIndex("by_projectId", q => q.eq("projectId", p._id))
					.collect()
			)
		);

		const containers = await ctx.db.query("infraContainers")
			.withIndex("by_ownerId", c => c.eq("ownerId", user._id))
			.collect();
		const templates = await Promise.all(containers.map(c => ctx.db.get(c.templateId)));
		const infraMap = new Map(
			containers.map((c, i) => [c._id, { ...c, template: templates[i] }]),
		);

		const infraBuckets = await Promise.all(
			containers.map(c =>
				ctx.db.query("deployments")
					.withIndex("by_infraId", q => q.eq("infraId", c._id))
					.collect()
			)
		);

		const all = [
			...projectBuckets.flat().map(d => ({
				...d,
				project: d.projectId ? projectMap.get(d.projectId) : undefined,
				infra: undefined,
			})),
			...infraBuckets.flat().map(d => ({
				...d,
				project: undefined,
				infra: d.infraId ? infraMap.get(d.infraId) : undefined,
			})),
		].sort((a, b) => b._creationTime - a._creationTime);

		return all;
	}
});

export const getQueuedDeployments = internalQuery({
	args: {
		id: v.id("nodes")
	},
	handler: async (ctx, args) => {
		const rows = await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.id))
			.collect();

		const enriched = await Promise.all(rows.map(async (dep) => {
			const project = dep.projectId ? await ctx.db.get(dep.projectId) : null;
			const container = dep.infraId ? await ctx.db.get(dep.infraId) : null;
			const infra = container
				? { ...container, template: await ctx.db.get(container.templateId) }
				: null;
			return { ...dep, project, infra };
		}));

		const queued = enriched.filter(q => q.status === "queued");

		return queued;
	}
})

export const getDeletingDeployments = internalQuery({
	args: { id: v.id("nodes") },
	handler: async (ctx, args) => {
		const rows = await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.id))
			.collect();

		const enriched = await Promise.all(rows.map(async (dep) => {
			const project = dep.projectId ? await ctx.db.get(dep.projectId) : null;
			const container = dep.infraId ? await ctx.db.get(dep.infraId) : null;
			const infra = container
				? { ...container, template: await ctx.db.get(container.templateId) }
				: null;
			return { ...dep, project, infra };
		}));

		return enriched.filter(d => d.status === "deleting");
	}
})
