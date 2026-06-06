import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const clearSecretsForEnv = internalMutation({
	args: { envId: v.id("environments") },
	handler: async (ctx, args) => {
		const secrets = await ctx.db.query("secrets")
			.withIndex("by_envId", q => q.eq("environmentId", args.envId))
			.collect();
		for (const s of secrets) {
			await ctx.db.delete(s._id);
		}
	}
});

export const deleteSecretById = internalMutation({
	args: { id: v.id("secrets") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	}
});

export const patchSecretCrypto = internalMutation({
	args: {
		id: v.id("secrets"),
		key: v.string(),
		wrappedKey: v.string(),
		wrapIv: v.string(),
		wrapTag: v.string(),
		ciphertext: v.string(),
		dataIv: v.string(),
		dataTag: v.string(),
	},
	handler: async (ctx, args) => {
		const { id, ...rest } = args;
		await ctx.db.patch(id, rest);
	}
});

export const insertSecret = internalMutation({
	args: {
		environmentId: v.union(v.id("environments"), v.id("infraEnvironments")),
		key: v.string(),
		wrappedKey: v.string(),
		wrapIv: v.string(),
		wrapTag: v.string(),
		ciphertext: v.string(),
		dataIv: v.string(),
		dataTag: v.string(),
		kind: v.union(v.literal("infra"), v.literal("project")),
	},
	handler: async (ctx, {
		environmentId,
		key,
		wrapIv,
		wrappedKey,
		wrapTag,
		ciphertext,
		dataIv,
		dataTag,
		kind
	}) => {
		return await ctx.db.insert("secrets", {
			environmentId: environmentId,
			key: key,
			kind: kind,
			wrapIv: wrapIv,
			wrappedKey: wrappedKey,
			wrapTag: wrapTag,
			ciphertext: ciphertext,
			dataIv: dataIv,
			dataTag: dataTag
		});
	}
})
