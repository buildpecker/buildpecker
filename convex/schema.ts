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
		repoUrl: v.string()
	}).index("by_ownerId", ["ownerId"]),
	nodes: defineTable({
		userId: v.id("users"),
		tokenHash: v.string(),
		name: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
	}).index("by_userId", ["userId"])
		.index("by_tokenHash", ["tokenHash"]),
	deployments: defineTable({
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		imageUri: v.string(),
		branch: v.string(),
		status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed")),
		sha: v.string(),
	}).index("by_nodeId", ["nodeId"])
		.index("by_projectId", ["projectId"]),
	environments: defineTable({
		name: v.string(),
		deploymentId: v.id("deployments"),
		variables: v.record(v.string(), v.string()),
	}).index("by_deploymentId", ["deploymentId"])
});
