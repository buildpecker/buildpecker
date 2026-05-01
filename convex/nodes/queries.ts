import { query } from "../_generated/server";

export const getAllNodes = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("nodes").collect();
	}
});
