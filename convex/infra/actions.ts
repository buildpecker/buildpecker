import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureDnsCname } from "../lib/cfTunnel";

const ROOT_DOMAIN = "parthajeet.xyz";

function slugify(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export const deployInfra = action({
	args: {
		nodeId: v.id("nodes"),
		infraId: v.id("infraContainers"),
		isPublic: v.boolean(),
		ports: v.optional(v.array(v.object({
			name: v.string(),
			containerPort: v.number(),
		}))),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
	},
	handler: async (ctx, args): Promise<Id<"deployments">> => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const node = await ctx.runQuery(api.nodes.queries.getNodeById, { id: args.nodeId });
		if (!node) throw new Error("No deployable node found!");

		const container = await ctx.runQuery(api.infra.queries.getInfraContainerById, { id: args.infraId });
		if (!container) throw new Error("Infra container not found");
		if (container.ownerId !== user._id) throw new Error("Forbidden");

		const routes: { name: string; hostname: string; containerPort: number }[] = [];

		if (args.isPublic) {
			if (!container.template?.canBePublic) throw new Error("This template cannot be made public");
			const slug = slugify(container.containerName) || args.infraId;
			for (const port of args.ports ?? []) {
				const name = slugify(port.name);
				if (!name || port.containerPort <= 0) continue;
				const hostname = `${name}-${slug}.${ROOT_DOMAIN}`;
				await ensureDnsCname(hostname, node.cloudflareTunnelId);
				routes.push({ name: port.name, hostname, containerPort: port.containerPort });
			}
		}

		return await ctx.runMutation(internal.deployments.mutations.insertDeployment, {
			name: container.containerName,
			nodeId: args.nodeId,
			type: "infra",
			infraId: args.infraId,
			status: args.status,
			branch: "",
			sha: "",
			imageUri: "",
			publicUrl: "",
			routes: routes.length > 0 ? routes : undefined,
		});
	},
});
