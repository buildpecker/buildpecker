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

		let publicUrl = "";
		if (args.isPublic) {
			const slug = slugify(container.containerName) || args.infraId;
			publicUrl = `${slug}.${ROOT_DOMAIN}`;
			await ensureDnsCname(publicUrl, node.cloudflareTunnelId);
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
			publicUrl,
		});
	},
});
