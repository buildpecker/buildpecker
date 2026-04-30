import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		externalId: v.string(),
		authToken: v.string(),
	}).index("by_externalId", ["externalId"]),
	projects: defineTable({
		name: v.string()
	}),
	nodes: defineTable({
		name: v.string(),
		cpu: v.string(),
		memory: v.string(),
		hostname: v.string()
	}),
	deployments: defineTable({
		name: v.string(),
		node_id: v.id("nodes"),
		project_id: v.id("projects"),
		github_url: v.string()
	}),
	environments: defineTable({
		name: v.string(),
		deployment_id: v.id("deployments"),
		variables: v.record(v.string(), v.string()),
	})
});
