import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		externalId: v.string(),
		authToken: v.string(),
	}).index("by_externalId", ["externalId"])
		.index("by_authToken", ["authToken"]),
	projects: defineTable({
		name: v.string(),
		ownerId: v.id("users"),
		framework: v.string(),
		defaultBranch: v.string(),
		repoUrl: v.string(),
		buildCommand: v.string(),
		startCommand: v.string(),
	}).index("by_ownerId", ["ownerId"]),
	nodes: defineTable({
		userId: v.id("users"),
		tokenHash: v.string(),
		name: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
		lastHeartbeat: v.number(),
		cloudflareTunnelId: v.string(),
		cloudflareTunnelToken: v.string(),
	}).index("by_userId", ["userId"])
		.index("by_tokenHash", ["tokenHash"])
		.index("by_cloudflareTunnelId", ["cloudflareTunnelId"]),
	deployments: defineTable({
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		publicUrl: v.string(),
		imageUri: v.string(),
		branch: v.string(),
		status: v.union(
			v.literal("queued"),
			v.literal("processing"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled"),
			v.literal("deleting"),
		),
		sha: v.string(),
	}).index("by_nodeId", ["nodeId"])
		.index("by_projectId", ["projectId"]),
	secrets: defineTable({
		environmentId: v.id("environments"),
		key: v.string(),
		ciphertext: v.string(),
		wrappedKey: v.string(),
		wrapIv: v.string(),
		dataIv: v.string(),
		dataTag: v.string(),
		wrapTag: v.string(),
	})
		.index("by_ciphertext", ["ciphertext"])
		.index("by_envId", ["environmentId"])
		.index("by_envId_key", ["environmentId", "key"]),
	environments: defineTable({
		projectId: v.id("projects"),
	}).index("by_projectId", ["projectId"])
});
