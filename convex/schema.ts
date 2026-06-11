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
	infraTemplates: defineTable({
		identifier: v.string(),
		name: v.string(),
		version: v.string(),
		logoUrl: v.string(),
		composeYaml: v.string(),
		canBePublic: v.optional(v.boolean()),
		postInstall: v.optional(v.array(v.object({
			name: v.string(),
			service: v.string(),
			command: v.string(),
		}))),
		healthCheck: v.optional(v.object({
			service: v.string(),
			command: v.string(),
		})),
	}),
	infraContainers: defineTable({
		nodeId: v.id("nodes"),
		ownerId: v.id("users"),
		templateId: v.id("infraTemplates"),
		containerName: v.string(),
		composeYaml: v.string(),
		postInstall: v.optional(v.array(v.object({
			name: v.string(),
			service: v.string(),
			command: v.string(),
		}))),
		healthCheck: v.optional(v.object({
			service: v.string(),
			command: v.string(),
		})),
	})
		.index("by_ownerId", ["ownerId"])
		.index("by_nodeId", ["nodeId"]),
	postInstallRuns: defineTable({
		deploymentId: v.id("deployments"),
		nodeId: v.id("nodes"),
		name: v.string(),
		service: v.string(),
		command: v.string(),
		status: v.union(
			v.literal("queued"),
			v.literal("running"),
			v.literal("done"),
			v.literal("failed"),
		),
		output: v.string(),
		exitCode: v.optional(v.number()),
	}).index("by_deploymentId", ["deploymentId"])
		.index("by_nodeId", ["nodeId"]),
	deployments: defineTable({
		name: v.string(),
		type: v.union(v.literal("project"), v.literal("infra")),
		nodeId: v.id("nodes"),
		projectId: v.optional(v.id("projects")),
		infraId: v.optional(v.id("infraContainers")),
		publicUrl: v.string(),
		customDomainUrl: v.optional(v.string()),
		routes: v.optional(v.array(v.object({
			name: v.string(),
			hostname: v.string(),
			containerPort: v.number(),
		}))),
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
		lastHealthCheck: v.number(),
		healthToken: v.optional(v.string()),
	}).index("by_nodeId", ["nodeId"])
		.index("by_projectId", ["projectId"])
		.index("by_infraId", ["infraId"]),
	secrets: defineTable({
		environmentId: v.union(v.id("environments"), v.id("infraEnvironments")),
		kind: v.union(v.literal("infra"), v.literal("project")),
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
	infraEnvironments: defineTable({
		infraId: v.id("infraContainers"),
	})
		.index("by_infraId", ["infraId"]),
	environments: defineTable({
		projectId: v.id("projects"),
	}).index("by_projectId", ["projectId"])
});
