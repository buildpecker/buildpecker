import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getQueuedDeployments = internalQuery({
	args: {
		id: v.id("nodes")
	},
	handler: async (ctx, args) => {
		let rows = await ctx.db.query("deployments")
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
