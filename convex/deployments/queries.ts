import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

export const getDeploymentsByProject = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		return await ctx.db.query("deployments")
			.withIndex("by_projectId", p => p.eq("projectId", args.projectId))
			.collect();
	}
});

export const getDeploymentsByNode = query({
	args: { nodeId: v.id("nodes") },
	handler: async (ctx, args) => {
		return await ctx.db.query("deployments")
			.withIndex("by_nodeId", n => n.eq("nodeId", args.nodeId))
			.collect();
	}
});

export const getDeploymentById = query({
	args: { id: v.id("deployments") },
	handler: async (ctx, args) => {
		const dep = await ctx.db.get(args.id);
		if (!dep) return null;
		const [project, node] = await Promise.all([
			ctx.db.get(dep.projectId),
			ctx.db.get(dep.nodeId),
		]);
		return { ...dep, project, node };
	}
});

export const getAllDeploymentsForUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const projects = await ctx.db.query("projects")
			.withIndex("by_ownerId", p => p.eq("ownerId", args.userId))
			.collect();
		const projectMap = new Map(projects.map(p => [p._id, p]));

		const buckets = await Promise.all(
			projects.map(p =>
				ctx.db.query("deployments")
					.withIndex("by_projectId", q => q.eq("projectId", p._id))
					.collect()
			)
		);

		const all = buckets
			.flat()
			.map(d => ({ ...d, project: projectMap.get(d.projectId) }))
			.sort((a, b) => b._creationTime - a._creationTime);

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

		//project metadata
		const projects = await Promise.all(rows.map(async (dep) => await ctx.db.get("projects", dep.projectId)));

		const rowsWithProjects = rows.map((d, idx) => {
			return { ...d, project: projects[idx] }
		})

		const queued = rowsWithProjects.filter(q => q.status === "queued");

		return queued;
	}
})
