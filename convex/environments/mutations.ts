import { v } from "convex/values"
import { mutation } from "../_generated/server"

export const createProjectEnvironment = mutation({
	args: {
		id: v.id("projects"),
		envString: v.string(),
	},
	handler: async (ctx, args) => {
		const envId = await ctx.db.insert("environments", {
			projectId: args.id
		});

		let envs = args.envString.split('/\n/g');
		envs = envs.filter(e => e !== "");
		let secrets = envs.map((env) => {

			let key = env.split("=")[0];
			let value = env.split("=")[1];

			const hasStartQuote = value[0] === '\"';
			const hasEndQuote = value[value.length - 1] === '\"';

			if (hasStartQuote) {
				value = value.substring(1);
			}

			if (hasEndQuote) {
				value = value.substring(0, value.length - 2);
			}

			return { key, value };
		});
	}
})
