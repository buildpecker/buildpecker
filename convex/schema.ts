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
	}),
	nodes: defineTable({
		userId: v.id("users"),
		token: v.string(),
		name: v.string(),
		cpuCores: v.number(),
		memoryMb: v.number(),
		diskMb: v.number(),
		hostname: v.string(),
	}),
	deployments: defineTable({
		name: v.string(),
		nodeId: v.id("nodes"),
		projectId: v.id("projects"),
		imageUri: v.string(),
		branch: v.string(),
		sha: v.string(),
	}),
	environments: defineTable({
		name: v.string(),
		deploymentId: v.id("deployments"),
		variables: v.record(v.string(), v.string()),
	})
});
