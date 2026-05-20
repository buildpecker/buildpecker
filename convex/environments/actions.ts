import { v } from "convex/values";
import { action, httpAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const createProjectSecrets = action({
	args: {
		envId: v.id("environments"),
		envString: v.string(),
	},
	handler: async (ctx, args) => {
		const secrets = args.envString
			.split("\n")
			.filter(Boolean)
			.map((env) => {
				const [key, ...rest] = env.split("=");
				let value = rest.join("=");

				if (value.startsWith('"')) value = value.slice(1);
				if (value.endsWith('"')) value = value.slice(0, -1);

				return { key, value };
			});

		const encryptedEnvRes = await Promise.all(
			secrets.map(({ key, value }) =>
				ctx.runAction(
					internal.environments.nodejs.actions.encryptEnvVariable,
					{ key, value }
				)
			)
		);

		await Promise.all(
			encryptedEnvRes.map((secret) =>
				ctx.runMutation(
					internal.secrets.mutations.insertSecret,
					{
						...secret,
						environmentId: args.envId,
					}
				)
			)
		);
	},
});

export const addSecret = action({
	args: {
		projectId: v.id("projects"),
		key: v.string(),
		value: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const project = await ctx.runQuery(api.projects.queries.getProjectById, { id: args.projectId });
		if (!project) throw new Error("Project not found");
		if (project.ownerId !== user._id) throw new Error("Forbidden");

		const key = args.key.trim();
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			throw new Error("Invalid key: use letters, digits, underscores; must not start with a digit");
		}

		const existingEnvId = await ctx.runQuery(internal.environments.queries.getEnvByProjectId, { projectId: args.projectId });
		const envId: Id<"environments"> = existingEnvId
			?? (await ctx.runMutation(api.environments.mutations.createProjectEnvironment, { id: args.projectId }));

		const encrypted = await ctx.runAction(internal.environments.nodejs.actions.encryptEnvVariable, {
			key,
			value: args.value,
		});

		await ctx.runMutation(internal.secrets.mutations.insertSecret, {
			...encrypted,
			environmentId: envId,
		});
	}
});

export const updateSecret = action({
	args: {
		id: v.id("secrets"),
		key: v.string(),
		value: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const found = await ctx.runQuery(internal.secrets.queries.getSecretWithOwnership, { id: args.id });
		if (!found) throw new Error("Secret not found");
		if (found.ownerId !== user._id) throw new Error("Forbidden");

		const key = args.key.trim();
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			throw new Error("Invalid key: use letters, digits, underscores; must not start with a digit");
		}

		const encrypted = await ctx.runAction(internal.environments.nodejs.actions.encryptEnvVariable, {
			key,
			value: args.value,
		});

		await ctx.runMutation(internal.secrets.mutations.patchSecretCrypto, {
			id: args.id,
			...encrypted,
		});
	}
});

export const deleteSecret = action({
	args: { id: v.id("secrets") },
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const found = await ctx.runQuery(internal.secrets.queries.getSecretWithOwnership, { id: args.id });
		if (!found) throw new Error("Secret not found");
		if (found.ownerId !== user._id) throw new Error("Forbidden");

		await ctx.runMutation(internal.secrets.mutations.deleteSecretById, { id: args.id });
	}
});

export const revealSecret = action({
	args: { id: v.id("secrets") },
	handler: async (ctx, args): Promise<{ key: string; value: string }> => {
		const user = await ctx.runQuery(api.users.queries.current);
		if (!user) throw new Error("Unauthorized");

		const found = await ctx.runQuery(internal.secrets.queries.getSecretWithOwnership, { id: args.id });
		if (!found) throw new Error("Secret not found");
		if (found.ownerId !== user._id) throw new Error("Forbidden");

		return await ctx.runAction(internal.environments.nodejs.actions.decryptEnvVariable, {
			key: found.secret.key,
			wrappedKey: found.secret.wrappedKey,
			wrapIv: found.secret.wrapIv,
			wrapTag: found.secret.wrapTag,
			ciphertext: found.secret.ciphertext,
			dataIv: found.secret.dataIv,
			dataTag: found.secret.dataTag,
		});
	}
});

// TODO: Fix object level authorization
export const getEnvironmentSecretsAction = httpAction(async (ctx, req) => {
	const authHeader = req.headers.get("Authorization")
	const nodeToken = authHeader?.split(" ")[1] ?? "";

	if (!nodeToken) {
		throw new Error("Unauthorized - No node token");
	}

	const tokenHash = await ctx.runAction(internal.nodes.nodejs.actions.hashToken, { token: nodeToken });

	const node = await ctx.runQuery(internal.nodes.queries.getNodeByNodeToken, { tokenHash: tokenHash });

	if (!node) {
		throw new Error("Invalid node");
	}

	const body = await req.json();
	const { projectId } = body;

	const envId = await ctx.runQuery(internal.environments.queries.getEnvByProjectId, {
		projectId: projectId as Id<"projects">,
	});

	if (!envId) {
		throw new Error("No environment id found")
	}

	const secrets = await ctx.runQuery(internal.secrets.queries.getEnvSecrets, {
		envId: envId
	});

	const decryptedEnvRes = await Promise.all(
		secrets.map(s =>
			ctx.runAction(
				internal.environments.nodejs.actions.decryptEnvVariable,
				{
					wrapIv: s.wrapIv, wrapTag: s.wrapTag, wrappedKey: s.wrappedKey,
					dataIv: s.dataIv, dataTag: s.dataTag, ciphertext: s.ciphertext,
					key: s.key
				}
			)
		)
	);

	return new Response(JSON.stringify(decryptedEnvRes), { status: 200 });
})
