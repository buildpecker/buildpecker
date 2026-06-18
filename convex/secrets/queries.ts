import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getCurrentUser } from "../users/queries";
import { Id } from "../_generated/dataModel";

export const getEnvSecrets = internalQuery({
	args: {
		envId: v.union(v.id("environments"), v.id("infraEnvironments"))
	},
	handler: async (ctx, args) => {
		return await ctx.db.query("secrets")
			.withIndex("by_envId", q => q.eq("environmentId", args.envId))
			.collect();
	}
});

export const getSecretKeysForProject = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) throw new Error("Unauthorized");

		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Project not found");
		if (project.ownerId !== user._id) throw new Error("Forbidden");

		const env = await ctx.db.query("environments")
			.withIndex("by_projectId", q => q.eq("projectId", args.projectId))
			.unique();

		if (!env) return { envId: null, secrets: [] as { id: string; key: string }[] };

		const secrets = await ctx.db.query("secrets")
			.withIndex("by_envId", q => q.eq("environmentId", env._id))
			.collect();

		const items = secrets
			.map(s => ({ id: s._id, key: s.key }))
			.sort((a, b) => a.key.localeCompare(b.key));

		return { envId: env._id, secrets: items };
	}
});

export const getSecretWithOwnership = internalQuery({
	args: { id: v.id("secrets") },
	handler: async (ctx, args) => {
		const secret = await ctx.db.get(args.id);
		if (!secret) return null;
		switch (secret.kind) {
			case "project":
				const envId: Id<"environments"> = secret.environmentId as Id<"environments">;
				const env = await ctx.db.get(envId);
				if (!env) return null;
				const project = await ctx.db.get(env.projectId);
				if (!project) return null;
				return { secret, ownerId: project.ownerId };
			case "infra":
				const infraId: Id<"infraEnvironments"> = secret.environmentId as Id<"infraEnvironments">;
				const infraEnv = await ctx.db.get(infraId);
				if (!infraEnv) return null;
				const infra = await ctx.db.get(infraEnv.infraId);
				if (!infra) return null;
				return { secret, ownerId: infra.ownerId };
		}
	}
});
