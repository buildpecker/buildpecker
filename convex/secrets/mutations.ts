import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const insertSecret = internalMutation({
	args: {
		environmentId: v.id("environments"),
		key: v.string(),
		wrappedKey: v.string(),
		wrapIv: v.string(),
		wrapTag: v.string(),
		ciphertext: v.string(),
		dataIv: v.string(),
		dataTag: v.string(),
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
	}) => {
		return await ctx.db.insert("secrets", {
			environmentId: environmentId,
			key: key,
			wrapIv: wrapIv,
			wrappedKey: wrappedKey,
			wrapTag: wrapTag,
			ciphertext: ciphertext,
			dataIv: dataIv,
			dataTag: dataTag
		});
	}
})
